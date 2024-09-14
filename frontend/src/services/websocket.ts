let socket: WebSocket | null = null;

export const initializeSocket = (url: string) => {
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("Connected to WebSocket");
  };

  socket.onclose = () => {
    console.log("Disconnected from WebSocket");
  };
};

export const getSocket = () => socket;
