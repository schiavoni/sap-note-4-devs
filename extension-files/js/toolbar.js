'use strict'
var console = chrome.extension.getBackgroundPage().console;

class mySettings {
    constructor(){
		this.settingsPrefix = 'sn4d_';

		this.settings = {};
		this.settingsSync = new settingsSync();
	}
	setEvents(){
		let me = this;

		for (let [key, setting] of Object.entries(this.settings)) {
			let element = document.querySelector("#"+key);
			element.addEventListener('change', function(){ me.saveSettings(); });
		}
	}
    // loadSettings(){
	// 	let me = this;

	// 	chrome.storage.sync.get(Object.keys(me.settings), function(items) {
	// 		if(chrome.runtime.lastError){
	// 			console.log(chrome.runtime.lastError.message);
	// 			return;
	// 		}

	// 		if(items != undefined){
	// 			for (let [key, item] of Object.entries(items)) {
	// 				me.settings[key] = item;
	// 			}
	// 			me.fillFields();
	// 		}
	// 	});
	// }
	saveSettings(){
		let me = this;
		this.fillSettings();
		this.settingsSync.saveSettings(this.settings, function(settingsSetStatus){
			let message = "";

			for (let [key, lastError] of Object.entries(settingsSetStatus)) {
				console.log('['+key+', '+lastError+']:');
				if (lastError != undefined){
					message = lastError.message;
					break;
				}
			}
			
			if(message === ""){
				me.success("Sucessfuly updated!");
			} else {
				me.error(message);
			}
		});

		// for (let [key, setting] of Object.entries(this.settings)) {
		// 	let setObj = {};
		// 	setObj[key] = setting;

		// 	chrome.storage.sync.set(setObj, function() {
		// 		if(chrome.runtime.lastError){
		// 			error(chrome.runtime.lastError.message);
		// 			return;
		// 		}
		// 		success("Settings saved");
		// 	});
		// }
	}
	fillFields(){
		console.log("fillFields");
		for (let [key, setting] of Object.entries(this.settings)) {
			document.querySelector("#"+key).value = setting;
		}
	}
	fillSettings(){
		for (let key of Object.keys(this.settings)) {
			this.settings[key] = document.querySelector("#"+key).value;
		}
	}
	warning(text){
		this.message(text,"warning");
	}
	success(text){
		this.message(text,"success");
	}
	error(text){
		this.message(text,"error");
	}
	message(text,type){
		console.log('( text: '+text+', type: '+type+')');
		let messageDiv = document.querySelector(".messages");
		let newMessage = document.createElement("span");
		newMessage.innerHTML = text;
		newMessage.className = type;
		messageDiv.appendChild(newMessage);

		setTimeout(function(){
			newMessage.remove();
		},3000);
	}
	init(){
		let me = this;
		this.settingsSync.loadSettings(function(items){
			console.log('callback returned:');
			console.log(items);
			if(items != undefined)
				me.settings = items;
				me.setEvents();
				me.fillFields();
		});
	}
}

let objSettings = undefined;

document.addEventListener("DOMContentLoaded", function (event){
	//load the settings
	objSettings = new mySettings();
	objSettings.init();
});