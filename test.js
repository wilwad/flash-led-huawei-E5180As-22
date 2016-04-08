// mine: global variables
var state = 0;
var g_timer = null;
var headers = {};
var delay = 100;

// public: found this online
function randomIntFromInterval(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

// mine: created this from the errors in the source files (JS)
//       response from device is a code - mapping to english helps
var hw_errors = {
					100002: 'ERROR_SYSTEM_NO_SUPPORT', 
					100003: 'ERROR_SYSTEM_NO_RIGHTS',
					100004: 'ERROR_SYSTEM_BUSY',
					108001: 'ERROR_LOGIN_USERNAME_WRONG',
					108002: 'ERROR_LOGIN_PASSWORD_WRONG',
					108003: 'ERROR_LOGIN_ALREADY_LOGIN',
					108006: 'ERROR_LOGIN_USERNAME_PWD_WRONG',
					108007: 'ERROR_LOGIN_USERNAME_PWD_ORERRUN',
					120001: 'ERROR_VOICE_BUSY',
					125001: 'ERROR_WRONG_TOKEN',
					125002: 'ERROR_WRONG_SESSION',
					125003: 'ERROR_WRONG_SESSION_TOKEN'
				};

// mine: 
var toggle_func = function(){
	 window.clearInterval(g_timer);
	
	 if (state == 0)
	    state = 1;
	 else
	    state = 0;
	
	 // set the LED to on/off
	 toggleLED(state);
	 
	 // get a random delay for switching
	 // future: use audio from a song playing
	 delay = randomIntFromInterval(100,800)
	 console.log('flash interval set to', delay, 'ms');
	 
	 // go
	 g_timer = window.setInterval(toggle_func, delay);
};

// mine + Huawei code
// turns the LED on a Huawei 4G LTE E5180 on/off
var toggleLED = function (toggle){

// since we are running this code in a Browser window
// AFTER you have logged in (user: admin, pwd: admin)
// we need to stop the logout timer
clearTimeout(g_logoutTimer);

// Huawei: code to check which verification token to use 
//         when making a request. A new VT is generated
//         by the server after every request :D
//
if($.isArray(g_requestVerificationToken)) {
	if(g_requestVerificationToken.length > 0) {
		headers['__RequestVerificationToken'] = g_requestVerificationToken[0];
		g_requestVerificationToken.splice(0, 1);
		console.log('g_requestVerificationToken is ',g_requestVerificationToken);
	} else {
	     // error handling
	  	 console.log('g_requestVerificationToken.length !> 0');
	     toggle_func();	  // just reset
	     return;
   }

} else {
  headers['__RequestVerificationToken'] = g_requestVerificationToken;
}
 
// server uses REST api
// set the state of the LED
// where toggle == 1 -> LED ON
// where toggle == 0 -> LED OFF
// <?xml version:\"1.0\" encoding=\"UTF-8\"?><request><ledSwitch>"+toggle+"</ledSwitch></request>

$.ajax({
		url: 'http://192.168.8.1/api/led/circle-switch',
		headers: headers /* VT or you get error */,
		type: 'POST' /* their web uses JQuery 1.7 so manually set this or else fails */,
		data: "<?xml version:\"1.0\" encoding=\"UTF-8\"?><request><ledSwitch>"+toggle+"</ledSwitch></request>",
		success: function(data){ 
		        // xml response, parse out the value of <code>?</code>
						var response = $(data).find("code").text()
						
						// get the error
						console.log(hw_errors[response]);						
			  },
		  error: function(a, xhr, status){ console.log('Error',status) ;}, /* correct this part, forgot */
		
		  /* this part updates the current VT to use on the next request ! */
	    complete: function(XMLHttpRequest, textStatus) {
	          
              var headers = XMLHttpRequest.getAllResponseHeaders();
              if(headers.indexOf('__RequestVerificationTokenone') > 0) {
                g_requestVerificationToken.push(getTokenFromHeader(headers, '__RequestVerificationTokenone'));
                if(headers.indexOf('__RequestVerificationTokentwo') > 0) {
                    g_requestVerificationToken.push(getTokenFromHeader(headers, '__RequestVerificationTokentwo'));
                }
		      } 
              else if(headers.indexOf('__requestverificationtokenone') > 0) {
                g_requestVerificationToken.push(getTokenFromHeader(headers, '__requestverificationtokenone'));
                if(headers.indexOf('__requestverificationtokentwo') > 0) {
                    g_requestVerificationToken.push(getTokenFromHeader(headers, '__requestverificationtokentwo'));
                }
              }
              else if(headers.indexOf('__RequestVerificationToken') > 0) {
                g_requestVerificationToken.push(getTokenFromHeader(headers, '__RequestVerificationToken'));
              }
              else if(headers.indexOf('__requestverificationtoken') > 0) {
                g_requestVerificationToken.push(getTokenFromHeader(headers, '__requestverificationtoken'));
              }
              else {
                log.error('MAIN: saveAjaxData can not get response token');
              }
         }
});};

// Test the LED
// toggleLED(1) to turn on
// toggleLED(0); // to turn off

// start a timer!
toggle_func();
