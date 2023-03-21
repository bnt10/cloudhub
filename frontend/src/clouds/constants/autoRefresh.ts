// library
import _ from 'lodash'

// constants
import {
  AutoRefreshOptionType,
  AutoRefreshOption,
  defaultAutoRefreshOptions,
  autoRefreshHeader,
  autoRefreshOptionPaused,
} from 'src/shared/components/dropdown_auto_refresh/autoRefreshOptions'

export const CLOUD_AUTO_REFRESH = {default: 0}

export const autoRefreshOptions: AutoRefreshOption[] = [
  {
    id: 'auto-refresh-header',
    milliseconds: 9999,
    label: 'Refresh',
    type: AutoRefreshOptionType.Header,
  },
  {
    id: 'auto-refresh-paused',
    milliseconds: 0,
    label: 'Paused',
    type: AutoRefreshOptionType.Option,
  },
  {
    id: 'auto-refresh-30s',
    milliseconds: 30000,
    label: '30s',
    type: AutoRefreshOptionType.Option,
  },
  {
    id: 'auto-refresh-60s',
    milliseconds: 60000,
    label: '60s',
    type: AutoRefreshOptionType.Option,
  },
  {
    id: 'auto-refresh-5m',
    milliseconds: 300000,
    label: '5m',
    type: AutoRefreshOptionType.Option,
  },
]

export function getTimeOptionByGroup(groupName: string | undefined) {
  return (
    {
      openstack: [
        {...autoRefreshHeader, group: groupName},
        {...autoRefreshOptionPaused, group: groupName},
        {
          id: 'auto-refresh-5m-osp',
          milliseconds: 300000,
          label: '5m',
          type: AutoRefreshOptionType.Option,
          group: groupName,
        },
        {
          id: 'auto-refresh-10-osp',
          milliseconds: 600000,
          label: '10m',
          type: AutoRefreshOptionType.Option,
          group: groupName,
        },
        {
          id: 'auto-refresh-15m-osp',
          milliseconds: 900000,
          label: '15m',
          type: AutoRefreshOptionType.Option,
          group: groupName,
        },
        {
          id: 'auto-refresh-30m-osp',
          milliseconds: 1800000,
          label: '30m',
          type: AutoRefreshOptionType.Option,
          group: groupName,
        },
        {
          id: 'auto-refresh-60m-osp',
          milliseconds: 3600000,
          label: '60m',
          type: AutoRefreshOptionType.Option,
          group: groupName,
        },
      ],
      default: _.map(defaultAutoRefreshOptions, autoRefreshOption => ({
        ...autoRefreshOption,
        group: groupName,
      })),
    }[groupName] || null
  )
}
