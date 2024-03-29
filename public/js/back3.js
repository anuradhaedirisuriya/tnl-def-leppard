
        // global constants
        var FFTSIZE = 32;      // number of samples for the analyser node FFT, min 32
        var TICK_FREQ = 20;     // how often to run the tick function, in milliseconds
        var CIRCLES = 8;        // the number of circles to draw.  This is also the amount to break the files into, so FFTSIZE/2 needs to divide by this evenly
        var RADIUS_FACTOR = 120; // the radius of the circles, factored for which ring we are drawing
        var MIN_RADIUS = 1;     // the minimum radius of each circle
        var HUE_VARIANCE = 120;  // amount hue can vary by
        var COLOR_CHANGE_THRESHOLD = 10;    // amount of change before we change color
        var WAVE_EMIT_THRESHOLD = 15;   // amount of positive change before we emit a wave
        var WAVE_SCALE = 0.03;  // amount to scale wave per tick
        var WAVE_RADIUS = 200; // the radius the wave images will be drawn with

        // global variables
        var stage;              // the stage we draw everything to
        var h, w;               // variables to store the width and height of the canvas
        var centerX, centerY;   // variables to hold the center point, so that tick is quicker
        var messageField;       // Message display field
        var assetsPath = "assets/"; // Create a single item to load.
        var src = assetsPath + "Piano_Melody.mp3";  // set up our source
        var soundInstance;      // the sound instance we create
        var analyserNode;       // the analyser node that allows us to visualize the audio
        var freqFloatData, freqByteData, timeByteData;  // arrays to retrieve data from analyserNode
        var circles = {};       // object has of circles shapes
        var circleHue = 300;   // the base color hue used when drawing circles, which can change
        var waves = new createjs.Container();   // container to store waves we draw coming off of circles
        var circleFreqChunk;    // The chunk of freqByteData array that is computed per circle
        var dataAverage = [42,42,42,42];   // an array recording data for the last 4 ticks
        var waveImgs = []; // array of wave images with different stroke thicknesses

		
function init() {
            // create a new stage and point it at our canvas:
         
			var canvas = document.getElementById('testCanvas'),
                context = canvas.getContext('2d');

        // resize the canvas to fill browser window dynamically
        window.addEventListener('resize', resizeCanvas, false);
        
        function resizeCanvas() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            stage = new createjs.Stage(canvas);

            // set the width and height, so we only have to access this data once (quicker)
            h = canvas.height;
            w = canvas.width;
            // calculate the center point, so we only have to do this math once (quicker)
            centerX = w >> 1;
            centerY = h >> 1;
            
            // a message on our stage that we use to let the user know what is going on.  Useful when preloading.
            messageField = new createjs.Text("Loading Audio", "bold 24px Arial", "#FFFFFF");
            messageField.maxWidth = w;
            messageField.textAlign = "center";  // NOTE this puts the registration point of the textField at the center
            messageField.x = centerX;
            messageField.y = centerY;
            stage.addChild(messageField);
            stage.update(); 	//update the stage to show text

            createjs.Sound.addEventListener("fileload", createjs.proxy(handleLoad,this)); // add an event listener for when load is completed
            createjs.Sound.registerSound(src);  // register sound, which preloads by default
			
			drawStuff(); 
        }
        resizeCanvas();
        
        function drawStuff() {
                // do your drawing stuff here
        }
        }

function handleLoad(evt) {
            // get the context.  NOTE to connect to existing nodes we need to work in the same context.
           var context = createjs.WebAudioPlugin.context;

            // create an analyser node
            analyserNode = context.createAnalyser();
            analyserNode.fftSize = FFTSIZE;  //The size of the FFT used for frequency-domain analysis. This must be a power of two
            analyserNode.smoothingTimeConstant = 0.85;  //A value from 0 -> 1 where 0 represents no time averaging with the last analysis frame
            analyserNode.connect(context.destination);  // connect to the context.destination, which outputs the audio

            // attach visualizer node to our existing dynamicsCompressorNode, which was connected to context.destination
            var dynamicsNode = createjs.WebAudioPlugin.dynamicsCompressorNode;
            dynamicsNode.disconnect();  // disconnect from destination
            dynamicsNode.connect(analyserNode);

            // set up the arrays that we use to retrieve the analyserNode data
            freqFloatData = new Float32Array(analyserNode.frequencyBinCount);
            freqByteData = new Uint8Array(analyserNode.frequencyBinCount);
            timeByteData = new Uint8Array(analyserNode.frequencyBinCount);

            // calculate the number of array elements that represent each circle
            circleFreqChunk = analyserNode.frequencyBinCount / CIRCLES;

            // enable touch interactions if supported on the current device, and display appropriate message
            if (createjs.Touch.enable(stage)) {
                messageField.text = "Touch to start";
            } else {
                messageField.text = "Click to start";
            }
            stage.update(); 	//update the stage to show text

          // wrap our sound playing in a click event so we can be played on mobile devices
             stage.addEventListener("stagemousedown", startPlayback);
			 
		   
        }

        // this will start our playback in response to a user click, allowing this demo to work on mobile devices
function startPlayback(evt) {
            // we only start once, so remove the click/touch listener
            stage.removeEventListener("stagemousedown", startPlayback);

            if(soundInstance) {return;} // if this is defined, we've already started playing.  This is very unlikely to happen.
			
            // we're starting, so we can remove the message
            stage.removeChild(messageField);

            // start playing the sound we just loaded, looping indefinitely
            soundInstance = createjs.Sound.play(src, {loop:-1});

          /*    // testing function that allows a quick stop
            stage.addEventListener("stagemousedown", function(){
                createjs.Ticker.removeEventListener("tick", tick);
                createjs.Sound.stop();
            }); */

            // create circles so they are persistent
            for(var i=0; i<CIRCLES; i++) {
                var circle = circles[i] = new createjs.Shape();
           		// set the composite operation so we can blend our image colors
                circle.compositeOperation = "lighter";
                stage.addChild(circle);
            }
            
            // add waves container to stage
            stage.addChild(waves);

            // start the tick and point it at the window so we can do some work before updating the stage:
            createjs.Ticker.addEventListener("tick", tick);
            createjs.Ticker.setInterval(TICK_FREQ);
        }

function tick(evt) {
            analyserNode.getFloatFrequencyData(freqFloatData);  // this gives us the dBs
            analyserNode.getByteFrequencyData(freqByteData);  // this gives us the frequency
            analyserNode.getByteTimeDomainData(timeByteData);  // this gives us the waveform

            var lastRadius = 0;  // we use this to store the radius of the last circle, making them relative to each other
            // run through our array from last to first, 0 will evaluate to false (quicker)
            for(var i=0; i<CIRCLES; i++) {
                var freqSum = 0;
                var timeSum = 0;
                for(var x = circleFreqChunk; x; x--) {
                    var index = (CIRCLES-i)*circleFreqChunk-x;
                    freqSum += freqByteData[index];
                    timeSum += timeByteData[index];
                }
                freqSum = freqSum / circleFreqChunk / 255;  // gives us a percentage out of the total possible value
                timeSum = timeSum / circleFreqChunk / 255;  // gives us a percentage out of the total possible value
                // NOTE in testing it was determined that i 1 thru 4 stay 0's most of the time

                // draw circle
                lastRadius += freqSum*RADIUS_FACTOR + MIN_RADIUS;
				
                color = createjs.Graphics.getHSL((i/CIRCLES*HUE_VARIANCE+circleHue)%360, 100, 100);
                var g = new createjs.Graphics().beginFill(color).drawRect(0, 0, w, h);
                circles[i].graphics = g;
            }

            // update our dataAverage, by removing the first element and pushing in the new last element
            dataAverage.shift();
            dataAverage.push(lastRadius);

            // get our average data for the last 3 ticks
            var dataSum = 0;
            for(var i = dataAverage.length-1; i; i--) {
                dataSum += dataAverage[i-1];
            }
            dataSum = dataSum / (dataAverage.length-1);

            // calculate latest change
            var dataDiff = dataAverage[dataAverage.length-1] - dataSum;

            // change color based on large enough changes
            if(dataDiff>COLOR_CHANGE_THRESHOLD || dataDiff<COLOR_CHANGE_THRESHOLD) {circleHue = circleHue + dataDiff;}

            // emit a wave for large enough changes
            if(dataDiff > WAVE_EMIT_THRESHOLD){
                // create the wave, and center it on screen:
                var wave = new createjs.Bitmap(getWaveImg(dataDiff*0.1+1));
				wave.x = centerX;
				wave.y = centerY;
				wave.regX = wave.regY = WAVE_RADIUS;
				
				// set the expansion speed as a factor of the value difference:
                wave.speed = dataDiff*0.1+1;
                
                // set the initial scale:
                wave.scaleX = wave.scaleY = lastRadius/WAVE_RADIUS;

                // add new wave to our waves container
                waves.addChild(wave);
            }

            // animate all of our waves by scaling them up by a fixed about
            var maxR = Math.sqrt(w*w+h*h)*0.5; // the maximum radius for the waves.
            for(var i = waves.getNumChildren()-1; i>-1; i--) {
                wave = waves.getChildAt(i);
                wave.scaleX = wave.scaleY = wave.scaleX+wave.speed*0.02;

                // check if it is offstage and therefore not visible, if so remove it
                if(wave.scaleX*WAVE_RADIUS > maxR) {
                    waves.removeChildAt(i);
                }
            }

            // draw the updates to stage
            stage.update();
        }
		
        function getWaveImg(thickness) {
        	// floor the thickness so we only have to deal with integer values:
        	thickness |= 0;
        	if (thickness < 1) { return null; }
        	
        	// if we already have an image with the right thickness, return it:
        	if (waveImgs[thickness]) { return waveImgs[thickness]; }
        	
        	// otherwise, draw the wave into a Shape instance:
			
        	var waveShape = new createjs.Shape();
			waveShape.graphics.setStrokeStyle(thickness).beginStroke (#FFFF).drawPolyStar(0, 0, WAVE_RADIUS/2, 8, 0.2, -90);
			
			// cache it to create a bitmap version of the shape:
			var r = WAVE_RADIUS+thickness;
			waveShape.cache(-r, -r, r*2, r*2);
			
			// save the image into our list, and return it:
			waveImgs[thickness] = waveShape.cacheCanvas
			return waveShape.cacheCanvas;
        }
        