'use strict'
class settingsSync {
    constructor(){
		this.settings = {
							'codeTrunctionThreshold': 999999,
							'maxCIColumns': 3
						};
	}
    loadSettings(callback){
		let me = this;

		chrome.storage.sync.get(Object.keys(me.settings), function(items) {
			if(chrome.runtime.lastError){
				console.log(chrome.runtime.lastError.message);
			}

			if(items != undefined){
				for (let [key, item] of Object.entries(items)) {
					me.settings[key] = item;
				}
			}

			me.settings.codeTrunctionThreshold++;me.settings.codeTrunctionThreshold--;
			me.settings.maxCIColumns++;me.settings.maxCIColumns--;
			
			callback(me.settings);
		});
	}
	saveSettings(newSettings, callback){
		let me = this;
		let settingsSetStatus = [];

		for (let [key, setting] of Object.entries(newSettings)) {
			let setObj = {};
			setObj[key] = setting;

			chrome.storage.sync.set(setObj, function() {
				settingsSetStatus.push(chrome.runtime.lastError);
				if(settingsSetStatus.length == Object.entries(me.settings).length)
					callback(settingsSetStatus);
			});
		}
	}
}