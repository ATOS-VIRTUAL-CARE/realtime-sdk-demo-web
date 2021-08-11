import { createStore } from 'vuex';
const backend = import.meta.env.VITE_APP_SERVER ? `http://${import.meta.env.VITE_APP_SERVER}` : window.origin;

const store = createStore({
  state() {
    return {
      activeRoom: null,
      mediaPreselection: null,
      user: null,
      tokens: {},
      config: null,
      version: process.env.PACKAGE_VERSION,
      sdkVersion: process.env.PACKAGE_VERSION_SDK
    };
  },

  getters: {
    user: state => {
      if (!state.user) {
        state.user = JSON.parse(localStorage.getItem('user')) || {};
      }
      return state.user;
    },
    useAudio: state => {
      return !state.mediaPreselection|| state.mediaPreselection === 'audio' || state.mediaPreselection === 'both';
    },
    useVideo: state => {
      return !state.mediaPreselection|| state.mediaPreselection === 'video' || state.mediaPreselection === 'both';
    }
  },

  mutations: {
    saveToken: (state, obj) => {
      if (!obj || !obj.token || !obj.room) {
        throw 'saveToken: token or room is null';
      }
      state.tokens[obj.room] = obj.token;
    },
    setUser: (state, user) => {
      localStorage.setItem('user', JSON.stringify(user));
      state.user = user;
    }
  },

  actions: {
    async createRoom({ commit }, name) {
      // Ask app server to create room with the VCS service
      let res = await fetch(`${backend}/api/room`, {
        method: 'post',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        if (res.status === 409) {
          throw `Room "${name}" already exists`;
        }
        throw res.statusText;
      }
      res = await res.json();
      commit('saveToken', { room: res.room.name, token: res.room.token });
      console.log(`Created room ${name}`);
      return res.room.token;
    },
    async fetchRoom({ commit }, name) {
      let res = await fetch(`${backend}/api/room?name=${name}`, {
        method: 'get',
        headers: { 'content-type': 'application/json' }
      });
      if (!res.ok) {
        if (res.status === 404) {
          throw `Room ${name} not found`;
        } else {
          throw res.statusText;
        }
      }
      res = await res.json();
      commit('saveToken', { room: res.room.name, token: res.room.token });
      console.log(`Fetched room ${name}`);
      return res.room.token;
    },
    async fetchConfig({ state }) {
      let res = await fetch(`${backend}/api/config`, {
        method: 'get',
        headers: { 'content-type': 'application/json' }
      });
      if (!res.ok) {
        if (res.status === 404) {
          throw 'Config not found';
        } else {
          throw res.statusText;
        }
      }
      res = await res.json();
      state.config = res;
      console.log('Fetched config', res);
    }
  }
});

export default store;