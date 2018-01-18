$("a").tooltip();
  var audioInputSelect = $('#audioInput');
  var videoInputSelect = $('#videoInput');
  var selectors = [audioInputSelect, videoInputSelect];

  var audioDevices = [],
      videoDevices = [];

function handleError(error) {
console.log('navigator.getUserMedia error: ', error);
}

function gotDevices(devices) {

var values = selectors.map(function(select) {
  return select.value;
});

selectors.forEach(function(select) {
  while (select.firstChild) {
    select.removeChild(select.firstChild);
  }
});

    for (var i = 0; i !== devices.length; ++i) {
        var device = devices[i];

        var option = document.createElement('option');
        option.value = device.deviceId;

        if (device.kind === 'audioinput') {
            option.text = device.label || 'Microphone ' + (audioDevices.length + 1);
            audioInputSelect[0].appendChild(option);
            audioDevices.push(device);
        } else if (device.kind === 'videoinput') {
            option.text = device.label || 'Camera ' + (videoDevices.length + 1);
            videoInputSelect[0].appendChild(option);
            videoDevices.push(device);
        }
    }
}

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  $('#localVideo')[0].srcObject = stream;
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function start() {
  if (window.stream) {
    window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }
  var audioSource = audioInputSelect[0].value;
  var videoSource = videoInputSelect[0].value;
  var constraints = {
    audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  navigator.mediaDevices.getUserMedia(constraints).
      then(gotStream).then(gotDevices).catch(handleError);
}

audioInputSelect.onchange = start;
videoInputSelect.onchange = start;

var room = location.search && location.search.split('?')[1];
//    usernameInput
var usernameCookie = getCookie("freecam-username");
if (usernameCookie != null){
  $('#usernameInput')[0].value = usernameCookie;
}

if (room){
  $('#meetingIdInput')[0].value = room;
}

// create our webrtc connection
var webrtc = new SimpleWebRTC({
    localVideoEl: 'localVideo',

    autoRequestMedia: true,
    debug: true,
    detectSpeakingEvents: false,
    nick: $('#usernameInput')[0].value,
    media: {
        audio: false,
        video: {
          mandatory: {
             minAspectRatio: 1.7777777778,
             maxAspectRatio: 1.7777777778,
             
          }
        }
    }
});

webrtc.on('readyToCall', function () {
  //start();
  setAudio(!webrtc.webrtc.isAudioEnabled());
  setVideo(!webrtc.webrtc.isVideoEnabled());
  $('#joinMeetingButton')[0].enabled = true;
});

webrtc.on('channelMessage', function (peer, label, data) {

});

webrtc.on('videoAdded', function (video, peer) {
    console.log('video added', peer);
//
      var remotes = document.getElementById('cameras');
      if (remotes) {
          var d = document.createElement('div');
          d.className = 'camera-wrap';
          d.id = 'container_' + webrtc.getDomId(peer);
          d.appendChild(video);

          var usernameDiv = document.createElement('div');
          usernameDiv.className = "username";
          usernameDiv.id = "username_" + webrtc.getDomId(peer);
          usernameDiv.appendChild(document.createTextNode(peer.nick));
          d.appendChild(usernameDiv);

          remotes.appendChild(d);
      }
//    } else if (peer.type == "screen") {

  //  }

    makeEqualSize();
});

webrtc.on('videoRemoved', function (video, peer) {
    console.log('video removed ', peer);
    var remotes = document.getElementById('cameras');
    var el = document.getElementById('container_' + webrtc.getDomId(peer));
    if (remotes && el) {
        remotes.removeChild(el);
    }

    makeEqualSize();
});

// Since we use this twice we put it here
function setRoom(name) {
    var newUrl = location.pathname + '?' + name;
    history.replaceState({foo: 'bar'}, null, newUrl);
    $('#meetingLinkInput')[0].value = location.href;
}

var videoToggle = $('#joinVideo'),
   setVideo = function(bool) {
     videoToggle.attr('data-original-title', (bool ? 'Join Video' : 'Leave Video'));
     $('#joinVideo-icon').attr('class', bool ? "icon-camera" : "icon-camera-disabled");
   };

videoToggle.click(function () {
 if (webrtc.webrtc.isVideoEnabled()){
   webrtc.pauseVideo();
 }else{
   webrtc.resumeVideo();
 }
});

var audioToggle = $('#joinAudio'),
   setAudio = function(bool) {
     audioToggle.attr('data-original-title', (bool ? 'Join Audio' : 'Leave Audio'));
      $('#joinAudio-icon').attr('class', (bool ? "icon-microphone" : "icon-mic-disabled"));
   };

audioToggle.click(function () {
 if (webrtc.webrtc.isAudioEnabled()){
   webrtc.mute();
 }else{
   webrtc.unmute();
 }
});

webrtc.on('audioOn', function () {
 setAudio(false);
});
webrtc.on('audioOff', function () {
   setAudio(true);
});
webrtc.on('videoOn', function () {
   setVideo(false);
});
webrtc.on('videoOff', function () {
   setVideo(true);
});

var button = $('#screenShareButton'),
    setButton = function (bool) {
      button.attr('data-original-title', (bool ? 'Share Screens (Not finished!)' : 'Stop Sharing'));
    };

if (!webrtc.capabilities.supportScreenSharing) {
  button.disabled = 'disabled';
}

webrtc.on('localScreenStopped', function () {
    setButton(true);
});

setButton(true);

button.click(function () {
    if (webrtc.getLocalScreen()) {
        webrtc.stopScreenShare();
        setButton(true);
    } else {
        webrtc.shareScreen(function (err) {
            if (err) {
                setButton(true);
            } else {
                setButton(false);
            }
        });

    }
});

$('#settingsLink').click(function () {
   $('#settingsModal').modal();
});

$('#leaveMeeting').click(function () {
  webrtc.leaveRoom();
  webrtc.pauseVideo();
  $('#usernameInput')[0].value = webrtc.webrtc.config.nick;
  $('#joinRoomModal').modal();
});

$('#joinMeetingButton').click(function () {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode($('#usernameInput')[0].value));
  webrtc.webrtc.config.nick = div.innerHTML;
  $('#localUsername')[0].innerHTML = div.innerHTML;

  if (webrtc.webrtc.config.nick){
    setCookie("freecam-username", webrtc.webrtc.config.nick, 356);
  }

  var name = $('#meetingIdInput')[0].value;
  webrtc.joinRoom(name);
  setRoom(name);
  webrtc.resumeVideo();
  $('#joinRoomModal').modal('hide');
});

$('#inviteButton').click(function () {
  $('#showInviteLinkModal').modal('toggle');
});

$('#meetingLinkInput').click(function () {
  $(this).select();
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeEqualSize() {

  var wrap = $('.camera-container');
  var elements = $(".camera-container").find('.camera-wrap');

  var realCount = elements.length;
  var count = elements.length;

  var margin = 6;
  var windowWidth = wrap.width() - (count * margin);
  var windowHeight = wrap.height() - (count * margin);

  var rows = Math.floor(Math.sqrt(count));
  var cols = Math.ceil(Math.sqrt(count));

  if (count > 1 && count % 2 != 0){
    cols--;
    rows++;
  }

  var remainder = elements.length % 2;
  var elWidth = ((windowWidth - (count * margin))  / cols);
  var elHeight = (elWidth * 0.5625);//((windowHeight - (count * margin))  / rows);

  if (count > 1){
    while (elHeight * rows > (windowHeight - (count * margin))){
      elWidth--;
      elHeight = (elWidth * 0.5625);
    }

    if (elWidth < ((windowHeight - (count * margin))  / rows)){
      var w = elWidth;
      var h = elHeight;
      elWidth = windowWidth - (margin * 2);
      elHeight = elWidth * 0.5625;

      while (elHeight * count > (windowHeight - (count * margin))){
        elWidth--;
        elHeight = (elWidth * 0.5625);
      }
    }
  }

  elements.css({
    width: elWidth + "px",
    height: elHeight + "px"
  });
  console.log("Items: " + count + " Rows: " + rows + " Cols: " + cols);
}

$(document).ready(function () {
  $(window).resize(function (e) {
  makeEqualSize();
  });

  navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

  $('#load-overlay').fadeOut();
  $('#joinRoomModal').modal();

  makeEqualSize();
});
