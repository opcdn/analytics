!function(t){"use strict";function e(e,n){var r=document.getElementById("Vz6Ps4Gi3Sl4");if("true"===r.getAttribute("data-dnt")&&navigator.doNotTrack)return!1;var a={};a.website_url="www."===t.location.hostname.substring(0,4)?t.location.hostname.replace("www.",""):t.location.hostname,a.referrer=n||t.document.referrer,a.page=t.location.href.replace(/#.+$/,""),a.screen_resolution=screen.width+"x"+screen.height,e&&(a.event=e);var o=new XMLHttpRequest;o.open("POST",r.getAttribute("data-host")+"/api/event",!0),o.setRequestHeader("Content-Type","application/json, text/javascript; charset=utf-8"),o.send(JSON.stringify(a))}try{var n=history.pushState;history.pushState=function(){var r=t.location.href.replace(/#.+$/,"");n.apply(history,arguments),e(null,r)},t.onpopstate=function(t){e(null)},t.pa={},t.pa.track=e,e(null)}catch(t){console.log(t.message)}}(window);
