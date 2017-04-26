package main

// InboundMessage is used to unmarshal incoming events
type InboundMessage struct {
	Type   string `json:"type"`
	Data   Data   `json:"data"`
	Sender int32  `json:"id"`
}

// OutboundMessage is used to marshal outgoing events
type OutboundMessage struct {
	Type     string `json:"type"`
	Data     Data   `json:"data"`
	Receiver int32  `json:"id"`
}

// Data stores the payload of each message
type Data struct {
	Message string `json:"message"`
	Game    Game   `json:"game"`
}

// Player encapsulates data for users
type Player struct {
	Pos Point `json:"pos"`
	ID  int32 `json:"id"`
}

// World encapsulates data for the world state
type World struct {
	Players []Player `json:"players"`
	Size    int32    `json:"size"`
	Seed    int32    `json:"seed"`
}

type Game struct {
	World World `json:"world"`
}

// Point is a cartesian tuple
type Point struct {
	X int32 `json:"x"`
	Y int32 `json:"y"`
}
