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
function GranularPhrase(granularPhraseIndex, minToneDur, maxToneDur, minReps, maxReps, grainInterval, minGrainDur, maxGrainDur, minVol, maxVol, octaveShift, phraseDur, pitchArray) {
	// ok, get this: if there's a phraseDur, we use that to determine when the phrase will end;
	// otherwise we rely on min/max Reps.
	this.index = granularPhraseIndex;
	this.minToneDur = minToneDur;
	this.maxToneDur = maxToneDur;
	this.minReps = minReps;
	this.maxReps = maxReps;
	this.grainInterval = grainInterval;
	this.minGrainDur = minGrainDur;
	this.maxGrainDur = maxGrainDur;
	this.minVol = minVol;
	this.maxVol = maxVol;
	this.octaveShift = octaveShift;
	this.phraseDur = phraseDur;
	this.pitchArray = pitchArray.sort();
	this.lastPitch = 0.;
	this.numberOfReps = Math.floor(((maxReps - minReps) + 1) * Math.random() + minReps);
	this.octaveMultiplier = 1 + Math.floor((octaveShift + 1) * Math.random());
	if (this.octaveMultiplier > 1.) {
		this.minVol *= 0.5;
		this.maxVol *= 0.5;
	}
	this.targetTime = audioCtx.currentTime + phraseDur;
}

//What do I want to send it?
//buffer to use, duration, pitch
//then let it pick an appropriate subsection
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
	
	var fileNode = audioCtx.createBufferSource();
	var gainNode = audioCtx.createGain();
	var gainNode2 = audioCtx.createGain();
	gainNode.connect(gainNode2);
	gainNode2.connect(grainGainNode);
	gainNode2.gain.value = volume;
	fileNode.buffer = bufferToPlay;	
	fileNode.connect(gainNode);
	fileNode.playbackRate.value = pitchMultiplier;
	
	// delay before starting, time into buffer, duration of excerpt
	fileNode.start(0., startTime, grainDuration * pitchMultiplier);
	
	//gainNode.gain.value = 0.;
	gainNode.gain.setValueCurveAtTime(grainWindow, 0., grainDuration);
}

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

GranularPhrase.prototype.playGranularPhrase = function() {
	tickDownGranularPhrase(this.index);
}


function tickDownGranularPhrase(granularPhraseIndex) {
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


function scheduledGrainPlayer(bufferToPlay, minGrainDur, maxGrainDur, minVol, maxVol, pitchMultiplier, grainInterval, targetTime) {
	// play grain
	// calculate next grain time
	// if next grain time < toneEndTime, schedule next grain
	
	// kind of silly that some of the randomization is being done in the playGrain function,
	// while other randomization is being done here...

	var grainDensity = 1. / grainInterval;
	var grainDuration = (maxGrainDur - minGrainDur) * Math.random() + minGrainDur;
	var volume = (maxVol - minVol) * Math.random() + minVol;
	playGrain(bufferToPlay, grainDuration, pitchMultiplier, volume);
	//remember, all in seconds...
	//var timeToNextGrain = (2. * grainInterval) * Math.random();
	var timeToNextGrain = grainInterval;
	var nextGrainTime = audioCtx.currentTime + timeToNextGrain;
	if (nextGrainTime < targetTime && cues2Play.panic != "yes") {
		var scheduleString = "scheduledGrainPlayer(" +
		"audioBuffers[0]" + ", " +
		minGrainDur + ", " +
		maxGrainDur + ", " +
		minVol + ", " +
		maxVol + ", " +
		pitchMultiplier + ", " +
		grainInterval + ", " +
		targetTime + ")";
		//alert(scheduleString);
		//remember, setTimeout wants ms...
		var timeToNextGrainInMs = timeToNextGrain * 1000.;
		if (timeToNextGrainInMs < 10.) {
			timeToNextGrainInMs = 10.;
		}
		var timeoutID = window.setTimeout(scheduleString, timeToNextGrainInMs);
	}
}



