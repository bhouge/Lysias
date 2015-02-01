/**
 * IntermittentSound
 * by Ben Houge
 * IntermittentSound encapsulates the functionality of a sound that repeats intermittently, appropriately enough.
 * It's a technique I've used in many of my pieces (dating back to graphic score 'A Reading from _____' in 2003): 
 * Specify a buffer of PCM data, min/max repeats, and min/max pause between repeats.
 * Note that we're talking repeats, not plays; when you press play, it will always play at least once.
 */

// creating an intermittentSound object with an object constructor
function IntermittentSound(buffer, minPause, maxPause, minReps, maxReps, minVol, maxVol) {
	this.buffer = buffer;
	this.minPause = minPause;
	this.maxPause = maxPause;
	this.minReps = minReps;
	this.maxReps = maxReps;
	this.minVol = minVol;
	this.maxVol = maxVol;
	this.numberOfInputs = 0;
	this.outputNode;
	this.isPlaying;
	// Douglas Crockford told me to do this: http://www.crockford.com/javascript/private.html
	// It's a convention that allows private member functions to access the object
	// due to an error in the ECMAScript Language Specification
	var that = this;
	
	function playBuffer(bufferIndex, volume) {
		//alert("insideplayBuffer");
		var audioBufferSource = that.outputNode.context.createBufferSource();
		//alert(audioBufferSource);
		audioBufferSource.buffer = bufferIndex;
		//alert(audioBufferSource.buffer);
		//alert(that.outputNode);
		//alert(that.outputNode.context);
		audioBufferGain = that.outputNode.context.createGain();
		//alert(audioBufferGain);
		audioBufferGain.gain.value = volume;
		//alert(audioBufferGain.gain);
		audioBufferSource.connect(audioBufferGain);
		//alert(audioBufferSource);
		audioBufferGain.connect(that.outputNode);
		//alert("did we get this far?");
		try {
			audioBufferSource.start(0., 0., audioBufferSource.buffer.duration);
		} catch(e) {
			alert(e);
		}
		//alert("so now we should have started playing...");
		
	}
	
	// making this a private member function
	function tickDownIntermittentSound() {
		//alert("inside tickdownsound");
		var volume = (that.maxVol - that.minVol) * Math.random() + that.minVol;
		//alert("vol=" + volume);
		playBuffer(that.buffer, volume);
		//alert("just called playBuffer");
		var bufferDur = that.buffer.duration;
		//alert("bufferDur=" + bufferDur);
		// ok, this will need to be replaced by having a stop message that will stop execution...
		if (that.numberOfReps > 0 && that.isPlaying) {
			var pauseDur = (that.maxPause - that.minPause) * 
			Math.random() + that.minPause;
			that.timerID = window.setTimeout(tickDownIntermittentSound, (pauseDur + bufferDur) * 1000.);
		}
		that.numberOfReps--;
	}
	
	this.play = function() {
		//alert("inside the play method");
		this.isPlaying = true;
		this.numberOfReps = Math.floor(((this.maxReps - this.minReps) + 1) * Math.random() + this.minReps);
		//alert(this.numberOfReps);
		tickDownIntermittentSound();
		//alert("just called tickDownIntermittentSound");
	}
	
	this.stop = function() {
		this.isPlaying = false;
		window.clearTimeout(this.timerID); 
	}
	
	this.connect = function(nodeToConnectTo) {
		//alert("inside the connect method");
		try {
			this.outputNode = nodeToConnectTo;
			//alert("setting output node to specified node");
		} catch(e) {
			//alert("setting output node to destination");
			if (nodeToConnectTo.destination) {
				this.outputNode = nodeToConnectTo.destination;
			} else {
				alert("It seems you have not specified a valid node.");
			}
		}
	}
}

/*
IntermittentSound.prototype.playIntermittentSound = function() {
	this.numberOfReps = Math.floor(((this.maxReps - this.minReps) + 1) * Math.random() + this.minReps);
	
	this.tickDownIntermittentSound(this.index);
}
*/

