

var app = {};

app.messageStorage = {};

app.init = function(){
	console.log('init');
}
app.send = function(message){
  $.ajax({
  // This is the url you should use to communicate with the parse API server.
  url: 'https://api.parse.com/1/classes/messages',
  type: 'POST',
  data: JSON.stringify(message),
  contentType: 'application/json',
  success: function (data) {
    this.messageStorage[data.objectId] = message;
  }.bind(this),
  error: function (data) {
    // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
    console.error('chatterbox: Failed to send message', data);
  }
});

}
app.fetch = function(){
  var stuff = $.ajax({
  // This is the url you should use to communicate with the parse API server.
  url: 'https://api.parse.com/1/classes/messages',
  type: 'GET',
  contentType: 'application/json',
  success: function (data) {
    data.results.forEach(function(ParseObj){
      if(!app.messageStorage.hasOwnProperty(ParseObj.objectId)){
        app.messageStorage[ParseObj.objectId] = {username:ParseObj.username,
        text:ParseObj.text,
        roomname:ParseObj.roomname};
      }
    });
  },
  error: function (data) {
    // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
    console.error('chatterbox: Failed to get message', data);
  }
});
}
app.clearMessages = function(){
  this.messageStorage = {};
	$('#chats').empty();
}
app.addMessage = function(message){
  var serverMsg = {
    username: window.location.search.substring(10),
    text: message,
    roomname: 'PLACEHOLDER'
  };
  var msg = $('<div class="message">' + serverMsg.text + '</div>');
  app.send(serverMsg);
	$('#chats').append(msg);
}
app.addRoom = function(roomname){
	var room = $("<section></section>");
  $('#roomSelect').append(room);
}