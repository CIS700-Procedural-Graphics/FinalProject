package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/Senior-Design-Kappa/sync-server/controller"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var (
	addr     = ":8000"
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	c *controller.Controller
)

func main() {

	c = controller.NewController()
	go c.Run()

	r := mux.NewRouter()

	r.HandleFunc("/health", health)
	r.HandleFunc("/play", handleConnection)

	s := http.Server{
		Handler:      r,
		Addr:         addr,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Printf("Listening and serving on %s\n", addr)

	log.Fatal(s.ListenAndServe())
}

// health reports 200 if services is up and running
func health(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "OK")
}

// handleConnection handles websocket requests from client
func handleConnection(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	for {
		msgType, msg, err := conn.ReadMessage()
		if err != nil {
			fmt.Println(err)
			return
		}
		fmt.Printf("%+v %+v\n", msgType, msg)

	}
}
