'use strict'

class myMessage {
	constructor(timeout){
		this.timeout = timeout;
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
		let messageDiv = document.querySelector(".messages");
		let newMessage = document.createElement("span");
		newMessage.innerHTML = text;
		newMessage.className = type;
		messageDiv.appendChild(newMessage);

		if (this.timeout != undefined){
			setTimeout(function(){
				newMessage.remove();
			},3000);
		}
	}
}