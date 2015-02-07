/**
 * 
 */

// what's the interface?
// play
// stop
// playDescending(and maybe here we supply the additional info?)

// minSoundDur, maxSoundDur
// minReps, maxReps
// interval between grains
// minGrainLength, maxGrainLength
// minVol, maxVol
// "octave shift flag" did I ever really use this?
// list of pitches
//playGranularPhrase:0, 3, 0.5, 6., 10., 2, 3, 0.2, 1., 1.2, 0.5, 0.75, 0, [9./8., 1., 7./6.]

// creating a GranularPhrase object with an object constructor
function GranularTone(buffer, minToneDur, maxToneDur, grainInterval, minGrainDur, maxGrainDur, minVol, maxVol, pitch) {
	// ok, get this: if there's a phraseDur, we use that to determine when the phrase will end;
	// otherwise we rely on min/max Reps.
	this.buffer = buffer;
	this.minToneDur = minToneDur;
	this.maxToneDur = maxToneDur;
	this.toneDur;
	this.grainInterval = grainInterval;
	this.minGrainDur = minGrainDur;
	this.maxGrainDur = maxGrainDur;
	this.minVol = minVol;
	this.maxVol = maxVol;
	this.outputNode;
	this.isPlaying = false;
	this.grainWindow = (function() {
		//Set half sine up as default, but allow it to be overridden
		var grainWindow;
		var grainWindowLength = 16384;
		grainWindow = new Float32Array(grainWindowLength);
		for (var i = 0; i < grainWindowLength; ++i)
		    grainWindow[i] = Math.sin(Math.PI * i / grainWindowLength);
		return grainWindow;
	})();

	// this should all be made private
	this.pitchArray = [];
	if (typeof(pitch) == 'number') {
		this.pitchArray.push(pitch);
	} else {
		this.pitchArray = pitch.sort();
	}
	this.currentPitch;
	this.lastPitch = 0.;
	this.minReps;
	this.maxReps;
	this.phraseDur;
	
	var grainTimerID;
	var phraseTimerID;
	var numberOfReps;
	var repsForDumbTest;
	var octaveMultiplier;
	// remember, we do this so that we can access member variables in private functions
	// http://www.crockford.com/javascript/private.html
	var that = this;
	
	function playGrain(bufferToPlay, grainDuration, pitchMultiplier, volume) {
		// this will be in seconds, adjusted for pitch
		var bufferDuration = (bufferToPlay.length/bufferToPlay.sampleRate)/pitchMultiplier;
		var startTime;
		if (grainDuration > bufferDuration) {
			grainDuration = bufferDuration;
			startTime = 0;
		} else {
			startTime = (bufferDuration - grainDuration) * Math.random() * pitchMultiplier;
		}
		
		var context = that.outputNode.context;
		var fileNode = context.createBufferSource();
		var gainNode = context.createGain();
		var gainNode2 = context.createGain();
		gainNode.connect(gainNode2);
		gainNode2.connect(that.outputNode);
		gainNode2.gain.value = volume;
		fileNode.buffer = bufferToPlay;	
		fileNode.connect(gainNode);
		fileNode.playbackRate.value = pitchMultiplier;
		
		// delay before starting, time into buffer, duration of excerpt
		fileNode.start(0., startTime, grainDuration * pitchMultiplier);
		
		//gainNode.gain.value = 0.;
		gainNode.gain.setValueCurveAtTime(that.grainWindow, 0., grainDuration);
	}
	
	function scheduledGrainPlayer() {
		// play grain
		// calculate next grain time
		// if next grain time < toneEndTime, schedule next grain
		
		// kind of silly that some of the randomization is being done in the playGrain function,
		// while other randomization is being done here...

		var grainDensity = 1. / that.grainInterval;
		var grainDuration = (that.maxGrainDur - that.minGrainDur) * Math.random() + that.minGrainDur;
		var volume = (that.maxVol - that.minVol) * Math.random() + that.minVol;
		playGrain(that.buffer, grainDuration, that.currentPitch, volume);
		//remember, all in seconds...
		//var timeToNextGrain = (2. * grainInterval) * Math.random();
		var timeToNextGrain = that.grainInterval;
		var nextGrainTime = that.outputNode.context.currentTime + timeToNextGrain;
		//  && cues2Play.panic != "yes"
		if (nextGrainTime < that.targetTime && that.isPlaying) {
			//remember, setTimeout wants ms...
			var timeToNextGrainInMs = timeToNextGrain * 1000.;
			if (timeToNextGrainInMs < 10.) {
				timeToNextGrainInMs = 10.;
			}
			// ran into problems pasing variables and then realized I don't have to!
			grainTimerID = window.setTimeout(scheduledGrainPlayer, timeToNextGrainInMs);
		} else {
			that.isPlaying = false;
		}
	}
	
	function scheduledPhrasePlayer() {
		var currentPhraseDur = that.play();
		//alert(currentPhraseDur);
		if (numberOfReps > 0) {
			phraseTimerID = window.setTimeout(scheduledPhrasePlayer, currentPhraseDur * 1000.)
		}
		numberOfReps--;
	}
	
	this.connect = function(nodeToConnectTo) {
		//alert("inside the connect method");
		try {
			if (nodeToConnectTo.destination) {
				this.outputNode = nodeToConnectTo.destination;
			} else {
				this.outputNode = nodeToConnectTo;
			}
			//alert("setting output node to specified node");
		} catch(e) {
			alert("It seems you have not specified a valid node.");
		}
	}
	
	this.play = function() {
		this.isPlaying = true;
		//note that these are in seconds
		this.toneDur = (this.maxToneDur - this.minToneDur) * Math.random() + this.minToneDur;
		//this.currentPitch = this.pitchArray[Math.floor((Math.random() * this.pitchArray.length))];
		
		if (this.pitchArray.length > 1) {
			do {
				this.currentPitch = this.pitchArray[Math.floor((Math.random() * this.pitchArray.length))];
			} while (this.currentPitch == this.lastPitch);
			this.lastPitch = this.currentPitch;
		} else {
			this.currentPitch = this.pitchArray[Math.floor((Math.random() * this.pitchArray.length))];
		}
		
		that.startTime = this.outputNode.context.currentTime;
		//that.realTime = startTime;
		this.targetTime = that.startTime + this.toneDur;
		//bufferToPlay, minGrainDur, maxGrainDur, minVol, maxVol, pitchMultiplier, grainInterval, targetTime
		//scheduledGrainPlayer(this.buffer, this.minGrainDur, this.maxGrainDur, this.minVol, this.maxVol, this.currentPitch, this.grainInterval, this.targetTime);
		scheduledGrainPlayer();
		return this.toneDur;
	}
	
	this.playRandomPhrase = function(minReps, maxReps, octaveShift) {
		this.maxReps = maxReps;
		this.minReps = minReps;
		this.phraseDur = 0.;
		numberOfReps = Math.floor(((maxReps - minReps) + 1) * Math.random() + minReps);
		octaveMultiplier = 1 + Math.floor((octaveShift + 1) * Math.random());
		if (octaveMultiplier > 1.) {
			this.minVol *= 0.5;
			this.maxVol *= 0.5;
		}
		// here you call the thing that just needs to tick down
		// yes, you should have one public function you call that initializes everything and calls the first event
		// and subsequently that thing just keeps calling itself until some end state is met
		repsForDumbTest = 3;
		//stupidTest();
		scheduledPhrasePlayer();
	}
	
	function stupidTest() {
		alert("meow");
		if (repsForDumbTest > 0) {
			window.setTimeout(stupidTest, 1000);
		}
		repsForDumbTest--;
	}

	this.stop = function() {
		//alert("nothing is stopping this, is it?");
		this.isPlaying = false;
		window.clearTimeout(grainTimerID);
		window.clearTimeout(phraseTimerID);
	}
}

/*
function playGranularTone(bufferToPlay, minToneDuration, maxToneDuration, grainInterval, minGrainDur, maxGrainDur, pitchMultiplier, minVol, maxVol) {
	//note that these are in seconds
	var toneDuration = (maxToneDuration - minToneDuration) * Math.random() + minToneDuration;
	startTime = audioCtx.currentTime;
	realTime = startTime;
	targetTime = startTime + toneDuration;
	//alert(startTime);
	//alert(targetTime);
	scheduledGrainPlayer(bufferToPlay, minGrainDur, maxGrainDur, minVol, maxVol, pitchMultiplier, grainInterval, targetTime);
	return toneDuration;
}
*/

function tickDownGranularPhrase() {
		var phraseToPlay = granularPhrases[granularPhraseIndex];
		// two different processes depending on whether it's descending or not
		// and this is kind of horrible, but what determines this is whether we use min/maxReps to determine duration
		// or whether we provide a phraseDur explicitly.
		if (phraseToPlay.phraseDur) {
			var pitchMultiplier;
			if (phraseToPlay.lastPitch == phraseToPlay.pitchArray[0]) {
				var newPitchIndex = Math.floor((phraseToPlay.pitchArray.length - 1) * Math.random()) + 1;
				pitchMultiplier = phraseToPlay.pitchArray[newPitchIndex];
			} else {
				var tempArray = [];
				var i;
				for (i = 0; i < phraseToPlay.pitchArray.length; i++) {
					if (phraseToPlay.pitchArray[i] < phraseToPlay.lastPitch || phraseToPlay.lastPitch == 0) {
						tempArray[i] = phraseToPlay.pitchArray[i];
					}
				}
				pitchMultiplier = tempArray[Math.floor(tempArray.length * Math.random())];
			}
			//play phrase
			var toneDur = playGranularTone(phraseToPlay.index, phraseToPlay.minToneDur, phraseToPlay.maxToneDur, phraseToPlay.grainInterval, phraseToPlay.minGrainDur, phraseToPlay.maxGrainDur, pitchMultiplier, phraseToPlay.minVol, phraseToPlay.maxVol);
			// if we're not at base pitch || we haven't hit the phraseDur yet, schedule next phrase
			if (pitchMultiplier != phraseToPlay.pitchArray[0] || audioCtx.currentTime < phraseToPlay.targetTime) {
				window.setTimeout(tickDownGranularPhrase, toneDur * 1000., granularPhraseIndex);
			}
		} else {
			// this is the original granularPhrase behavior before I added this descending nonsense
			//play the granularPhrase, checking not to repeat pitches
			var pitchMultiplier;
			do {
				var newPitchIndex = Math.floor((phraseToPlay.pitchArray.length) * Math.random()); 
				pitchMultiplier = phraseToPlay.pitchArray[newPitchIndex] * phraseToPlay.octaveMultiplier;
			} while (phraseToPlay.lastPitch == pitchMultiplier);
			var toneDur = playGranularTone(phraseToPlay.index, phraseToPlay.minToneDur, phraseToPlay.maxToneDur, phraseToPlay.grainInterval, phraseToPlay.minGrainDur, phraseToPlay.maxGrainDur, pitchMultiplier, phraseToPlay.minVol, phraseToPlay.maxVol);
			// two ways of counting down: min/maxReps (for random pitch choices) 
			// or checking to see whether we've exceeded the phraseDur (for descending phrases, since we always want to get back to the base note)
			//if the number of reps is greater than 0 cue another one
			if (phraseToPlay.numberOfReps > 0) {
				window.setTimeout(tickDownGranularPhrase, toneDur * 1000., granularPhraseIndex);
			}
			//tick down the number of reps
			granularPhrases[granularPhraseIndex].numberOfReps--;
		}
		//set last pitch used
		granularPhrases[granularPhraseIndex].lastPitch = pitchMultiplier;
	}


//buffer, duration, pitch, volume
//playGrain(this.buffer, 1., 1., 1.);



GranularTone.prototype.playGranularPhrase = function() {
	tickDownGranularPhrase(this.index);
}



// admitting that this is a little silly; ought to create the object in my switch below...
function playGranularPhrase(granularPhraseIndex, minToneDur, maxToneDur, minReps, maxReps, grainInterval, minGrainDur, maxGrainDur, minVol, maxVol, octaveShift, phraseDur, pitchArray) {
	granularPhrases[granularPhraseIndex] = new GranularPhrase(granularPhraseIndex, minToneDur, maxToneDur, minReps, maxReps, grainInterval, minGrainDur, maxGrainDur, minVol, maxVol, octaveShift, phraseDur, pitchArray);
	granularPhrases[granularPhraseIndex].playGranularPhrase();
}

//also a little silly...
function playGranularDescendingPhrase(granularPhraseIndex, minToneDur, maxToneDur, minReps, maxReps, grainInterval, minGrainDur, maxGrainDur, minVol, maxVol, octaveShift, pitchArray) {
	granularPhrases[granularPhraseIndex] = new GranularPhrase(granularPhraseIndex, minToneDur, maxToneDur, minReps, maxReps, grainInterval, minGrainDur, maxGrainDur, minVol, maxVol, octaveShift, pitchArray);
	granularPhrases[granularPhraseIndex].playGranularPhrase();
}



