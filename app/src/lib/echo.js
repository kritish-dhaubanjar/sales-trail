import axios from '@/lib/axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export default new Echo({
  broadcaster: 'pusher',
  key: process.env.PUSHER_APP_KEY,
  cluster: process.env.PUSHER_APP_CLUSTER,
  forceTLS: true,
  Pusher: Pusher,
  authorizer: (channel, options) => ({
    authorize: (socketId, callback) => {
      axios.post('/broadcasting/auth', { socket_id: socketId, channel_name: channel.name })
        .then(response => callback(false, response.data))
        .catch(error => callback(true, error))
    },
  })
});
