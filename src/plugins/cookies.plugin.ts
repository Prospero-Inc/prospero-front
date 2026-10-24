import Cookies from 'js-cookie'
class CookiesPlugin {
  private cookie: Cookies.CookiesStatic
  constructor() {
    this.cookie = Cookies
  }
  /** `expires` en días; sin él la cookie es de sesión y se pierde al cerrar
   * el navegador. */
  setName(name: string, value: string, expires?: number): void {
    this.cookie.set(name, value, {
      path: '/',
      sameSite: 'lax',
      ...(expires !== undefined && { expires })
    })
  }

  getName(name: string): string | undefined {
    return this.cookie.get(name)
  }

  remove(name: string): void {
    this.cookie.remove(name)
  }
}
export const cookiesPlugin = new CookiesPlugin()
