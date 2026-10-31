import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { IncomingMessage } from 'http'
import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { AsyncLocalStorage } from 'node:async_hooks'

import axiosInstance from '../axiosInstance'

// Server-only (imports node:async_hooks): never import it from `@/lib`'s
// barrel or from client code.
//
// Every browser request reaches the backend through this Next server, so
// without this the backend's rate limiter would see one IP for all users.
// The client IP of the request being served is kept in an AsyncLocalStorage
// and an axios interceptor forwards it as `X-Forwarded-For`; the backend
// only believes that header from private addresses (its `trust proxy`).

const requestContext = new AsyncLocalStorage<{ clientIp?: string }>()

/**
 * Last `X-Forwarded-For` hop: the one Caddy (or this server calling itself,
 * see NEXTAUTH_URL_INTERNAL) appended. Earlier entries are client-supplied.
 * The front's port is bound to 127.0.0.1, so only those can reach us.
 */
export const getClientIp = (req: IncomingMessage): string | undefined => {
  const header = req.headers['x-forwarded-for']
  const hops = (Array.isArray(header) ? header.join(',') : header ?? '')
    .split(',')
    .map(hop => hop.trim())
    .filter(Boolean)

  return hops.at(-1) ?? req.socket?.remoteAddress
}

export const runWithClientIp = <R>(req: IncomingMessage, fn: () => R): R =>
  requestContext.run({ clientIp: getClientIp(req) }, fn)

/** Wraps a `getServerSideProps` so its backend calls carry the client IP. */
export const withClientIp =
  <P extends Record<string, unknown>>(
    gssp: GetServerSideProps<P>
  ): GetServerSideProps<P> =>
  (context: GetServerSidePropsContext) =>
    runWithClientIp(context.req, () => gssp(context))

const forwardClientIp = (config: InternalAxiosRequestConfig) => {
  const clientIp = requestContext.getStore()?.clientIp
  if (clientIp) config.headers.set('X-Forwarded-For', clientIp)
  return config
}

// `axiosInstance` talks to the backend; the default `axios` is what
// authConfig uses for its self-calls to /api/proxy/{refresh-token,logout}.
axiosInstance.interceptors.request.use(forwardClientIp)
axios.interceptors.request.use(forwardClientIp)
