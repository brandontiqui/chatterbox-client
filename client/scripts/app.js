var Message = function(username, message, roomname) {
  this.username = username;
  this.text = message;
  this.roomname = roomname;
};

var app = {};
app.server = 'https://api.parse.com/1/classes/messages';
app.messageStorage = {};
app.queueMessage = [];
app.friendList = {};
app.rooms = { 'Main Room': true};

app.init = function() {
  app.fetch();
  console.log('init');
};
app.send = function(message) {
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
};

app.fetch = function() {
  var stuff = $.ajax({
  // This is the url you should use to communicate with the parse API server.
    url: 'https://api.parse.com/1/classes/messages',
    type: 'GET',
    contentType: 'application/json',
    success: function (data) {
      data.results.forEach(function(ParseObj) {
        if (!app.messageStorage.hasOwnProperty(ParseObj.objectId)) {
          var newMessage = new Message(ParseObj.username, ParseObj.text, ParseObj.roomname);
          app.messageStorage[ParseObj.objectId] = newMessage;
          app.queueMessage.push(newMessage);
          if (!app.rooms[ParseObj.roomname]) {
            app.rooms[ParseObj.roomname] = true;
            // app.addRoom(ParseObj.roomname.replace(/ /g, ''));
            app.addRoom(ParseObj.roomname);
          }
        }
      });
      for (var elem in app.queueMessage) {
        app.addMessage(app.queueMessage.pop());
      }

    },
    error: function (data) {
      // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to get message', data);
    }
  });
};

app.clearMessages = function() {
  app.messageStorage = {};
  app.queueMessage.length = 0;
  $('#chats').empty();
};

app.addMessage = function(message) {
  var msg = $('<div class="message"></div>');
  var username = $('<span class="username"></span>');
  var userMessage = $('<span class="text"></span>');
  msg.addClass(message.roomname ? message.roomname.replace(/ /g, '') : 'defaultToAll');
  username.text(message.username);
  username.addClass(message.username);
  if (app.friendList.hasOwnProperty(String(message.username))) {
    username.addClass('friend');
  }
  userMessage.text(message.text);
  username.on('click', function(msg) {
    var userClassStr = '.' + String(message.username);
    app.addFriend(username.text());
    $(userClassStr).addClass('friend');
  });
  msg.append(username).append($('<br>')).append(userMessage);
  $('#chats').prepend(msg);
  if (!app.canAdd(message.roomname)) {
    msg.hide();
  }
  return message;
};
app.addRoom = function(roomname) {

  var room = $('<option></option>');
  room.val(roomname);
  room.text(roomname);
  $('#roomSelect').append(room);
};
app.addFriend = function(friendName) {
  app.friendList[friendName] = true;
};
app.handleSubmit = function() {

};


$(document).ready(function() {
  $('#input').keydown(function(e) {
    if (e.keyCode === 13 && this.val()) {
      var message = new Message(window.location.search.substring(10), this.val(), $('#roomSelect').val());
      app.send(app.addMessage(message));
      this.val('');
    }
  }.bind($('#input')));

  $('#room-maker').keydown(function(e) {
    if (e.keyCode === 13 && this.val()) {
      app.addRoom(this.val());
      this.val('');
    }
  }.bind($('#room-maker')));

  $('#send').on('submit', function() {
    app.handleSubmit();
  });

  $('#roomSelect').on('change', function(e) {
    if ($(roomSelect).val() === 'All') {
      $('#chats').children().show();
    } else {
      $('#chats').children().hide();
      $('.' + $(roomSelect).val()).show();
    }
  });

  app.canAdd = function(messageRoom) {
    if ($('#roomSelect').val() === 'All') {
      return true;
    } else if ($('roomSelect').val() === messageRoom) {
      return true;
    }
    return false;
  };


  setInterval(function() {
    app.fetch();
  }, 2000);

});



