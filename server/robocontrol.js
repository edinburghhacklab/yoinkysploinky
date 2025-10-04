const setupRobot = (robot) => {
	if ( ! robot) {
		console.error("Cannot setup null robot");
	}	
	robot.onConnected =  function () {
		//console.log(robot.serial + " got connected");
	};
	robot.onDisconnected =  function (status, json) {
		//console.log(robot.serial + " got disconnected");
	};
	robot.onStateChange =  function () {
		//console.log(robot.serial + " got new state:", robot.state);
	};
	return robot.connect();
};

const CMDs = {
	startClean: (robot, Neato) => {
		return robot.startHouseCleaning({
			mode: Neato.Constants.ECO_MODE,
			modifier: Neato.Constants.HOUSE_FREQUENCY_NORMAL,
			navigationMode: Neato.Constants.EXTRA_CARE_OFF
		});
	},
	getStatus: (robot, Neato) => {
		return robot.getStatus();
	}
};


module.exports = {setupRobot, CMDs};
