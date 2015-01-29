/**
 * 
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
	// Douglas Crockford told me to do this: http://www.crockford.com/javascript/private.html
	// It's a convention that allows private member functions to access the object
	// due to an error in the ECMAScript Language Specification
	var that = this;
	
	// making this a private member function
	function tickDownIntermittentSound() {
		var volume = (that.maxVol - that.minVol) * Math.random() + that.minVol;
		playBuffer(that.buffer, volume);
		var bufferDur = audioBuffers[that.buffer].duration;
		// ok, this will need to be replaced by having a stop message that will stop execution...
		if (that.numberOfReps > 0 && cues2Play.panic != "yes") {
			var pauseDur = (that.maxPause - that.minPause) * 
			Math.random() + that.minPause;
			window.setTimeout(tickDownIntermittentSound, (pauseDur + bufferDur) * 1000.);
		}
		that.numberOfReps--;
	}
	
	this.playIntermittentSound = function() {
		this.numberOfReps = Math.floor(((this.maxReps - this.minReps) + 1) * Math.random() + this.minReps);
		tickDownIntermittentSound();
	}
	
	
}

/*
IntermittentSound.prototype.playIntermittentSound = function() {
	this.numberOfReps = Math.floor(((this.maxReps - this.minReps) + 1) * Math.random() + this.minReps);
	
	this.tickDownIntermittentSound(this.index);
}
*/

