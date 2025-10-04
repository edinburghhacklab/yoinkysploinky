//const $ = require('jquery');
const Neato = require('./lib/neato-0.10.0-module');
const express = require('express');
const mqtt = require("mqtt");
const robocontrol = require("./robocontrol");

const client = mqtt.connect("mqtt://mqtt.hacklab");
const app = express();
const port = 3000;
const secrets = require("./secrets.json");
const user = new Neato.User();
const Robot = Neato.Robot;

let robot = null;

console.log("Please go to the following URL to authenticate the server:");
console.log(user.login({
	clientId: secrets.client_id,
  scopes:      "control_robots+public_profile+maps",
  redirectUrl: "https://yoinkysploinky.hacklab.uk/oauth.html"
}));


// Setup MQTT
client.on("connect", () => {
  console.log("Connected to MQTT!");
  client.subscribe("yoinkysploinky/#", (err) => {
    if (err) {
	    console.error("Error subscribing to yoinkysploinky/#: ", err);
    }
  });
  client.subscribe("fridge-door/status", (err) => {
    if (err) {
	    console.error("Error subscribing to fridge-door/status: ", err);
    }
  });
});


let fridge_open_pings = 0;

client.on("message", (topic, message) => {
	msg = message.toString();
	if (topic === "fridge-door/status") {
		if (msg === "open") {
			fridge_open_pings += 1;

		} else if (msg === "closed") {
			fridge_open_pings = 0;
		} else {
			console.error("Unrecognized fridge status: ", msg);
		}
	}
});


app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.get('/api', (req, res) => {
	res.send("Waddup it yoinky sploinky!!!");
});

app.get('/api/cmd/:cmd', (req, res) => {
	if (robot) {
		const cmd = req.params.cmd;
		if (robocontrol.CMDs[cmd]) {
			robocontrol.CMDs[cmd](robot, Neato)
			.then(data => {
				res.json({data, success:true});
			}).catch(e => {
				console.log("Error running command \""+cmd+"\": ", e);
				res.json({success:false, error:e});
			});
		} else {
			res.json({success:false, error:"Command "+cmd+" not found"});
		}
	} else {
		res.json({success:false, error:"Robot not set up"});
	}
});

app.post('/api/oauth', (req, res) => {
	if (req.body.access_token) {
		user.token = req.body.access_token;
		console.log("Received access token, verifying...");
		user.isConnected()
			.then(() => {
				console.log("Token verified, server authenticated!");
				res.send("success");
				user.getRobots()
					.then(function (robots) {
						if (robots.length == 0) {
							console.error("No robots found on account.");
						}
						let new_robot = robots[0];
						console.log("Got robot:", new_robot.serial);
						robocontrol.setupRobot(new_robot)
							.then(data => {
								robot = new_robot;
							}).catch(e => {
								console.error("Error setting up robot:", e);
							});
					})
					.catch(function (data) {
						console.error("Failed to retrieve robots: ", data);
					});
			})
			.catch((e) => {
				console.log("Could not verify access token: ", e);
				res.send("could not verify token");
			});
	} else {
		res.send("missing access token");
	}
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
