package main

func (C *Controller) handleInit(msg InboundMessage) {
	p := Player{
		Pos: Point{X: 10, Y: 10},
		ID:  msg.Sender,
	}
	players := C.Game.World.Players
	players = append(players, p)
	C.Game.World.Players = players
	d := Data{
		Message: "alrighty, here you go",
		Game:    C.Game,
	}

	C.sendMessage("init", d, msg.Sender)
	C.broadcastMessage("sync", d, msg.Sender)
}

func (C *Controller) handleSync(msg InboundMessage) {
	C.Game = msg.Data.Game
	d := Data{
		Message: "catch up plz",
		Game:    C.Game,
	}
	C.broadcastMessage("sync", d, msg.Sender)
}

func (C *Controller) handleDisconnect(id int32) {
	players := C.Game.World.Players
	index := -1
	for i, p := range players {
		if p.ID == id {
			index = i
		}
	}
	players = append(players[:index], players[index+1:]...)
	C.Game.World.Players = players
	delete(C.Clients, id)
	d := Data{
		Message: "catch up plz",
		Game:    C.Game,
	}
	C.broadcastMessage("sync", d, -1)
}
