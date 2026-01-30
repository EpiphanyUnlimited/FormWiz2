import netlifyIdentity from 'netlify-identity-widget';

// Initialize the widget
netlifyIdentity.init();

export const auth = {
  login: () => {
    netlifyIdentity.open('login');
  },
  signup: () => {
    netlifyIdentity.open('signup');
  },
  logout: () => {
    netlifyIdentity.logout();
  },
  currentUser: () => {
    return netlifyIdentity.currentUser();
  },
  getToken: async () => {
    const user = netlifyIdentity.currentUser();
    if (!user) return null;
    // Check if token needs refresh
    const token = await user.jwt();
    return token;
  },
  on: (event: 'login' | 'logout', callback: (user: any) => void) => {
    netlifyIdentity.on(event, callback);
  },
  off: (event: 'login' | 'logout', callback: (user: any) => void) => {
    netlifyIdentity.off(event, callback);
  }
};
