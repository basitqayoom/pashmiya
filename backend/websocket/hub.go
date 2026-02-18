package websocket

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Client struct {
	ID     string
	UserID uint
	Conn   *websocket.Conn
	Send   chan []byte
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mutex      sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			log.Printf("Client connected: %s", client.ID)

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mutex.Unlock()
			log.Printf("Client disconnected: %s", client.ID)

		case message := <-h.broadcast:
			h.mutex.RLock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mutex.RUnlock()
		}
	}
}

func (h *Hub) SendToUser(userID uint, message interface{}) {
	msg, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	h.mutex.RLock()
	defer h.mutex.RUnlock()

	for client := range h.clients {
		if client.UserID == userID {
			select {
			case client.Send <- msg:
			default:
				log.Printf("Failed to send to client %s", client.ID)
			}
		}
	}
}

func (h *Hub) SendToAll(message interface{}) {
	msg, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	h.broadcast <- msg
}

var GlobalHub = NewHub()

func HandleWebSocket(c *gin.Context) {
	userIDStr := c.Query("user_id")
	var userID uint
	if userIDStr != "" {
		var tmp uint64
		if _, err := fmt.Sscanf(userIDStr, "%d", &tmp); err == nil {
			userID = uint(tmp)
		}
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		ID:     generateClientID(),
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
	}

	GlobalHub.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		GlobalHub.unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err == nil {
			if msg["type"] == "auth" {
				if userID, ok := msg["user_id"].(float64); ok {
					c.UserID = uint(userID)
					log.Printf("Client %s authenticated as user %d", c.ID, uint(userID))
				}
			}
		}
	}
}

func (c *Client) writePump() {
	defer c.Conn.Close()

	for {
		message, ok := <-c.Send
		if !ok {
			c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}

		w, err := c.Conn.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		w.Write(message)

		n := len(c.Send)
		for i := 0; i < n; i++ {
			w.Write([]byte{'\n'})
			w.Write(<-c.Send)
		}

		if err := w.Close(); err != nil {
			return
		}
	}
}

func generateClientID() string {
	return fmt.Sprintf("client-%d", time.Now().UnixNano())
}
