// funtion make full canvas as arectangle
function rec(evt) {
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
				
                color = createjs.Graphics.getHSL((i/CIRCLES*HUE_VARIANCE+circleHue)%360, 70, 30);
                var g = new createjs.Graphics().beginFill("#0000").drawRect(0, 0, w, h);
                circles[i].graphics = g;
            }

            // update our dataAverage, by removing the first element and pushing in the new last element
            dataAverage.shift();
            dataAverage.push(lastRadius);

            // get our average data for the last 3 recs
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
                var wave = new createjs.Bitmap(polyStarWave(dataDiff*0.1+1));
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

// function make inner part poly
function innerPolyStar(evt) {
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
				
                var color = createjs.Graphics.getHSL((i/CIRCLES*HUE_VARIANCE+circleHue)%360, 200, 50);
                var g = new createjs.Graphics().beginFill(color).drawPolyStar(centerX, centerY, lastRadius, 5, 0.6, -90);
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
//inner rectangle
        function innerRect(evt) {
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
                var color = createjs.Graphics.getHSL((i/CIRCLES*HUE_VARIANCE+circleHue)%360, 100, 50);
                var g = new createjs.Graphics().beginFill(color).drawCircle(centerX,centerY, lastRadius).endFill();
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
		
//function outer wave polyStar
function polyStarWave(thickness) {
        	// floor the thickness so we only have to deal with integer values:
        	thickness |= 0;
        	if (thickness < 1) { return null; }
        	
        	// if we already have an image with the right thickness, return it:
        	if (waveImgs[thickness]) { return waveImgs[thickness]; }
        	
        	// otherwise, draw the wave into a Shape instance:
			
        	var waveShape = new createjs.Shape();
			waveShape.graphics.setStrokeStyle(thickness).beginStroke (color).drawPolyStar(0, 0, WAVE_RADIUS/2, 8, 0.1, -90);
			
			// cache it to create a bitmap version of the shape:
			var r = WAVE_RADIUS+thickness;
			waveShape.cache(-r, -r, r*2, r*2);
			
			// save the image into our list, and return it:
			waveImgs[thickness] = waveShape.cacheCanvas
			return waveShape.cacheCanvas;
        }
		
//function outer wave star5
function getWaveImg(thickness) {
        	// floor the thickness so we only have to deal with integer values:
        	thickness |= 0;
        	if (thickness < 1) { return null; }
        	
        	// if we already have an image with the right thickness, return it:
        	if (waveImgs[thickness]) { return waveImgs[thickness]; }
        	
        	// otherwise, draw the wave into a Shape instance:
        	var waveShape = new createjs.Shape();
			waveShape.graphics.setStrokeStyle(thickness).beginStroke ("#FFF").drawPolyStar(0, 0, WAVE_RADIUS, 5, 0.6, -90);
			
			// cache it to create a bitmap version of the shape:
			var r = WAVE_RADIUS+thickness;
			waveShape.cache(-r, -r, r*2, r*2);
			
			// save the image into our list, and return it:
			waveImgs[thickness] = waveShape.cacheCanvas
			return waveShape.cacheCanvas;
        }
