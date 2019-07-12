package influx

import (
	"context"
	"fmt"

	cmp "github.com/snetsystems/cmp/backend"
)

var (
	// AllowAllDB means a user gets both read and write permissions for a db
	AllowAllDB = cmp.Allowances{"WRITE", "READ"}
	// AllowAllAdmin means a user gets both read and write permissions for an admin
	AllowAllAdmin = cmp.Allowances{"ALL"}
	// AllowRead means a user is only able to read the database.
	AllowRead = cmp.Allowances{"READ"}
	// AllowWrite means a user is able to only write to the database
	AllowWrite = cmp.Allowances{"WRITE"}
	// NoPrivileges occasionally shows up as a response for a users grants.
	NoPrivileges = "NO PRIVILEGES"
	// AllPrivileges means that a user has both read and write perms
	AllPrivileges = "ALL PRIVILEGES"
	// All means a user has both read and write perms. Alternative to AllPrivileges
	All = "ALL"
	// Read means a user can read a database
	Read = "READ"
	// Write means a user can write to a database
	Write = "WRITE"
)

// Permissions return just READ and WRITE for OSS Influx
func (c *Client) Permissions(context.Context) cmp.Permissions {
	return cmp.Permissions{
		{
			Scope:   cmp.AllScope,
			Allowed: AllowAllAdmin,
		},
		{
			Scope:   cmp.DBScope,
			Allowed: AllowAllDB,
		},
	}
}

// showResults is used to deserialize InfluxQL SHOW commands
type showResults []struct {
	Series []struct {
		Values [][]interface{} `json:"values"`
	} `json:"series"`
}

// Users converts SHOW USERS to cmp Users
func (r *showResults) Users() []cmp.User {
	res := []cmp.User{}
	for _, u := range *r {
		for _, s := range u.Series {
			for _, v := range s.Values {
				if name, ok := v[0].(string); !ok {
					continue
				} else if admin, ok := v[1].(bool); !ok {
					continue
				} else {
					c := cmp.User{
						Name:        name,
						Permissions: cmp.Permissions{},
					}
					if admin {
						c.Permissions = adminPerms()
					}
					res = append(res, c)
				}
			}
		}
	}
	return res
}

// Databases converts SHOW DATABASES to cmp Databases
func (r *showResults) Databases() []cmp.Database {
	res := []cmp.Database{}
	for _, u := range *r {
		for _, s := range u.Series {
			for _, v := range s.Values {
				if name, ok := v[0].(string); !ok {
					continue
				} else {
					d := cmp.Database{Name: name}
					res = append(res, d)
				}
			}
		}
	}
	return res
}

func (r *showResults) RetentionPolicies() []cmp.RetentionPolicy {
	res := []cmp.RetentionPolicy{}
	for _, u := range *r {
		for _, s := range u.Series {
			for _, v := range s.Values {
				if name, ok := v[0].(string); !ok {
					continue
				} else if duration, ok := v[1].(string); !ok {
					continue
				} else if sduration, ok := v[2].(string); !ok {
					continue
				} else if replication, ok := v[3].(float64); !ok {
					continue
				} else if def, ok := v[4].(bool); !ok {
					continue
				} else {
					d := cmp.RetentionPolicy{
						Name:          name,
						Duration:      duration,
						ShardDuration: sduration,
						Replication:   int32(replication),
						Default:       def,
					}
					res = append(res, d)
				}
			}
		}
	}
	return res
}

// Measurements converts SHOW MEASUREMENTS to cmp Measurement
func (r *showResults) Measurements() []cmp.Measurement {
	res := []cmp.Measurement{}
	for _, u := range *r {
		for _, s := range u.Series {
			for _, v := range s.Values {
				if name, ok := v[0].(string); !ok {
					continue
				} else {
					d := cmp.Measurement{Name: name}
					res = append(res, d)
				}
			}
		}
	}
	return res
}

// Permissions converts SHOW GRANTS to cmp.Permissions
func (r *showResults) Permissions() cmp.Permissions {
	res := []cmp.Permission{}
	for _, u := range *r {
		for _, s := range u.Series {
			for _, v := range s.Values {
				if db, ok := v[0].(string); !ok {
					continue
				} else if priv, ok := v[1].(string); !ok {
					continue
				} else {
					c := cmp.Permission{
						Name:  db,
						Scope: cmp.DBScope,
					}
					switch priv {
					case AllPrivileges, All:
						c.Allowed = AllowAllDB
					case Read:
						c.Allowed = AllowRead
					case Write:
						c.Allowed = AllowWrite
					default:
						// sometimes influx reports back NO PRIVILEGES
						continue
					}
					res = append(res, c)
				}
			}
		}
	}
	return res
}

func adminPerms() cmp.Permissions {
	return []cmp.Permission{
		{
			Scope:   cmp.AllScope,
			Allowed: AllowAllAdmin,
		},
	}
}

// ToInfluxQL converts the permission into InfluxQL
func ToInfluxQL(action, preposition, username string, perm cmp.Permission) string {
	if perm.Scope == cmp.AllScope {
		return fmt.Sprintf(`%s ALL PRIVILEGES %s "%s"`, action, preposition, username)
	} else if len(perm.Allowed) == 0 {
		// All privileges are to be removed for this user on this database
		return fmt.Sprintf(`%s ALL PRIVILEGES ON "%s" %s "%s"`, action, perm.Name, preposition, username)
	}
	priv := ToPriv(perm.Allowed)
	if priv == NoPrivileges {
		return ""
	}
	return fmt.Sprintf(`%s %s ON "%s" %s "%s"`, action, priv, perm.Name, preposition, username)
}

// ToRevoke converts the permission into InfluxQL revokes
func ToRevoke(username string, perm cmp.Permission) string {
	return ToInfluxQL("REVOKE", "FROM", username, perm)
}

// ToGrant converts the permission into InfluxQL grants
func ToGrant(username string, perm cmp.Permission) string {
	if len(perm.Allowed) == 0 {
		return ""
	}
	return ToInfluxQL("GRANT", "TO", username, perm)
}

// ToPriv converts cmp allowances to InfluxQL
func ToPriv(a cmp.Allowances) string {
	if len(a) == 0 {
		return NoPrivileges
	}
	hasWrite := false
	hasRead := false
	for _, aa := range a {
		if aa == Read {
			hasRead = true
		} else if aa == Write {
			hasWrite = true
		} else if aa == All {
			hasRead, hasWrite = true, true
		}
	}

	if hasWrite && hasRead {
		return All
	} else if hasWrite {
		return Write
	} else if hasRead {
		return Read
	}
	return NoPrivileges
}

// Difference compares two permission sets and returns a set to be revoked and a set to be added
func Difference(wants cmp.Permissions, haves cmp.Permissions) (revoke cmp.Permissions, add cmp.Permissions) {
	for _, want := range wants {
		found := false
		for _, got := range haves {
			if want.Scope != got.Scope || want.Name != got.Name {
				continue
			}
			found = true
			if len(want.Allowed) == 0 {
				revoke = append(revoke, want)
			} else {
				add = append(add, want)
			}
			break
		}
		if !found {
			add = append(add, want)
		}
	}

	for _, got := range haves {
		found := false
		for _, want := range wants {
			if want.Scope != got.Scope || want.Name != got.Name {
				continue
			}
			found = true
			break
		}
		if !found {
			revoke = append(revoke, got)
		}
	}
	return
}
