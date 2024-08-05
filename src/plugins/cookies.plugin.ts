import Cookies from 'js-cookie'
class CookiesPlugin {
  private cookie: Cookies.CookiesStatic
  constructor() {
    this.cookie = Cookies
  }
  setName(name: string, value: string): void {
    this.cookie.set(name, value, {
      path: '/'
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
