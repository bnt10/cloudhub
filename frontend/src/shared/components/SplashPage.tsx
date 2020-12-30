import React, {SFC, ReactElement} from 'react'
import classnames from 'classnames'
import {InjectedRouter} from 'react-router'

interface Props {
  router: InjectedRouter
  children: ReactElement<any>
}

const SplashPage: SFC<Props> = ({router = null, children}) => {
  return (
    <div className="auth-page">
      <div className="auth-box">
        <div
          className={classnames('auth-logo', {
            'go-home': router,
          })}
          onClick={() => {
            router && router.push('/')
          }}
        />

        {children}
      </div>
      <p className="auth-credits">
        Copyright by &copy;Snetsystems Co., Ltd. (Derived by{' '}
        <span className="icon cubo-uniform" />
        Chronograf)
      </p>
      <div className="auth-image" />
    </div>
  )
}

export default SplashPage
