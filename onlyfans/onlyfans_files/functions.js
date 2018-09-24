function onPing(callback) {
  $(function () {
    $(document.body).on('ping', function (data) {
      callback(data.pong);
    });
  });
}

function doPong(data) {
  $(document.body).trigger({
    type: 'ping',
    pong: data
  });
}

function StartWS(fp) {
  var sess = $.cookie('sess'),
    endpoint = '/ws2g/',
    data = {
      fp: fp,
      act: 'connect'
    };
  if (USERID && 'undefined' !== typeof sess && sess) {
    endpoint = '/ws2/';
    data.sess = sess;
  }
  ws = new WebSocket('wss://ws.' + window.location.hostname + endpoint);
  ws.onopen = function () {
    ws.send(JSON.stringify(data));
    $(window).trigger('ws_opened');
  };
  ws.onclose = function () {
    setTimeout(StartWS, 5000);
  };
  ws.onmessage = function (evt) {
    doPong(JSON.parse(evt.data));
  };
}

function showPreloader() {
  $('.global_preloader').addClass('active');
}

function hidePreloader() {
  $('.global_preloader').removeClass('active');
}

function alert(message, close_callback) {
  hidePreloader();
  all_modals_close();
  my_dialog({
    message: message,
    close_callback: close_callback
  });
}

var my_callback = [];

function my_dialog(data) {
  title = typeof data.title === 'undefined' ? 'Message' : data.title;
  message = typeof data.message === 'undefined' ? '' : data.message;
  buttons = typeof data.buttons === 'undefined' ? [] : data.buttons;
  form = typeof data.form === 'undefined' ? [] : data.form;
  if (typeof data.close_callback !== 'undefined') {
    $('#dialog').bind('hidden.bs.modal', function () {
      $(this).unbind('hidden.bs.modal');
      data.close_callback();
    });
  }
  $('#dialog .modal-title').html(title);
  $('#dialog .dialog_message').html(message);
  if (form.length > 0) {
    var frm = '<form class="form-horizontal tasi-form">';
    $.each(form, function (i, item) {
      switch (item.type) {
        case 'text':
          frm += '<div class="form-group">\n\
								<label class="col-sm-2 col-sm-2 control-label">' + item.title + '</label>\n\
								<div class="col-sm-10">\n\
									<input class="form-control dialog_form_control field_' + item.name + '" type="text">\n\
								</div>\n\
							</div>';
          break;
        case 'textarea':
          frm += '<div class="form-group">\n\
								<label class="col-sm-2 col-sm-2 control-label">' + item.title + '</label>\n\
								<div class="col-sm-10">\n\
									<textarea class="form-control dialog_form_control field_' + item.name + '" rows="6"></textarea>\n\
								</div>\n\
							</div>';
          break;
        case 'select':
          frm += '<div class="form-group">\n\
								<label class="col-lg-12 control-label">' + item.title + '</label>\n\
								<div class="col-lg-12">\n\
									<select class="form-control dialog_form_control field_' + item.name + '">\n\
									<option value="0"></option>';
          $.each(item.list, function (j, reason) {
            frm += '<option value="' + reason.id + '">' + reason.name + '</option>';
          });
          frm += '</select>\n\
								</div>\n\
							</div>';
          break;
      }
    });
    frm += '</form>';
    $('#dialog .dialog_form').html(frm);
  }
  if ($('#dialog .modal-body').text().replace(/( |\t|\r\n|\n|\r)/gm, "").length == 0) {
    $('#dialog .modal-body').remove();
  }
  $('#dialog .modal-footer').html('<button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>');
  if (typeof buttons != 'undefined') {
    $.each(buttons, function (i, item) {
      var b_cls = 'btn';
      if (typeof item.class == 'undefined') {
        b_cls += ' btn-primary';
      } else {
        b_cls += ' ' + item.class;
      }
      if (typeof item.default != 'undefined' && item.default) {
        b_cls += ' dialog_default_button ';
      }
      var b_title = item.title;
      my_callback[i] = item.onclick;
      var btn = '<button type="button" class="' + b_cls + '" onclick="my_callback[' + i + ']();">' + b_title + '</button>';
      $('#dialog .modal-footer').append(btn);
    });
  }
  if ($('#dialog .dialog_default_button').length > 0) {
    $('#dialog .dialog_form form').on('keydown', 'input.dialog_form_control', function (e) {
      var code = e.keyCode || e.which;
      if (code == 13) {
        $('#dialog .dialog_default_button').click();
        return false;
      }
    });
  }
  $("#dialog").modal();
}

function my_dialog_close() {
  $('#dialog .modal-header .close').click();
}

function all_modals_close() {
  $('.subscribe_modal.in .close').click();
  $('.modal-header .close').click();
}

function my_confirm(title, message, callback) {
  my_dialog({
    title: title,
    message: message,
    buttons: [{
      title: 'YES',
      onclick: function () {
        callback();
        my_dialog_close();
      }
    }]
  });
}

function reloadPage() {
  $(window).unbind('beforeunload');
  top.location.href = top.location.href.split('#')[0];
}

function showMessage(str) {
  alert(str);
}

function showFormErrors(data) {
  $('.error_place').html('').hide();
  for (var field in data) {
    $('.error_place_for_' + field).html(data[field]).show();
  }
}

function reinitAlerts() {
  $('#system_messages_wrapper .alert').unbind('closed.bs.alert');
  $('#system_messages_wrapper .alert').bind('closed.bs.alert', function () {
    var me = $(this);
    $.post('/component/messages/post/close', {
      message: me.attr('message_id')
    });
  });
}

CHAT_ACTIVE = false;
CHAT_USER = 0;
CHAT_LAST_TIME = 0;

function startChat(username, userid, avatar) {
  stopChat();
  all_modals_close();
  $('#chat_modal .chat_username').text(username);
  $('#chat_modal .chat_useravatar').attr('src', avatar ? avatar : '/theme/onlyfans/images/blank.gif');
  CHAT_USER = userid;
  CHAT_USER_AVATAR = avatar ? avatar : '/theme/onlyfans/images/blank.gif';
  CHAT_ACTIVE = true;
  CHAT_LAST_TIME = 0;
  updateChatMessages();
  if (!CHATS_IN_PAGE) {
    $("#chat_modal").modal();
  }
  return false;
}

function stopChat() {
  CHAT_ACTIVE = false;
  $('#chat_modal .chat_messages_list').html('');
}

function showChatMessage(message, prepend, no_scroll) {
  if (message.from.id == CHAT_USER || message.to.id == CHAT_USER) {
    var list = $('#chat_modal .chat_messages_list');
    var old = list.find('.chat_message[message_id="' + message.id + '"]');
    if (!old.length) {
      var blank = '<li class="chat_message" message_id="' + message.id + '" hash="" price="' + message.price + '">\n\
							<a class="profile_link online_status_class" user_id="" href="">\n\
								<img class="avatar" />\n\
							</a>\n\
							<div class="msg_body_wrapper">\n\
								<div class="msg_body_inner">\n\
									<div class="msg_body"></div>\n\ ';

      blank += '<div class="msg_body_media"></div>\n\ ';
      blank += '<div class="msg_body_status"></div>\n\ ';

      blank += '<span class="msg_timestamp"></span>\n\
								</div>\n\
							</div>\n\
						</li>';
      if ('undefined' !== typeof prepend && prepend) {
        list.prepend(blank);
      } else {
        list.append(blank);
      }
      var li = list.find('.chat_message[message_id="' + message.id + '"]');
    } else {
      var li = old;
    }
    if (li.attr('hash') != message.hash) {
      li.attr('hash', message.hash);
    }
    if (message.from.me) {
      li.removeClass('chat_message_from_notme').addClass('chat_message_from_me');
      if (message.can_unsend) {
        li.find('.btn-unsend').remove();
        li.append('<button class="btn btn-default btn-unsend" type="button">Unsend <span class="counter">' + message.can_unsend + '</span>s</button>');
        var unsendBtn = li.find('.btn-unsend');
        if (interval) {
          clearInterval(interval);
        }
        var interval = setInterval(function () {
          var counter = unsendBtn.find('.counter'),
            value = parseInt(counter.text(), 10) - 1;
          if (value) {
            counter.text(value);
          } else {
            unsendBtn.remove();
          }
        }, 1000);
      }
    } else {
      li.removeClass('chat_message_from_me').addClass('chat_message_from_notme');
    }
    li.removeClass('paid-with-media').removeClass('paid-without-media');
    li.find('.profile_link.online_status_class').attr({
      'user_id': message.from.id,
      'href': message.from.url
    });

    if (-1 !== ONLINE.indexOf(message.from.id)) {
      li.find('.online_status_class').addClass('online');
    }

    li.find('.profile_link.online_status_class .avatar').attr('src', message.from.avatar).attr('alt', message.from.name);
    li.find('.msg_timestamp').html(message.from.name + ', ' + message.date);
    var media_html = '';
    if (!li.find('.msg_body_media').length) {
      li.find('.msg_body').after('<div class="msg_body_media"/>');
    }
    if (!message.is_media_ready) {
      var wait = li.find('.msg_body_media .media_processing_chat_message');
      if (!wait.length) {
        li.find('.msg_body_media').html('<span class="media_processing_chat_message"><img src="/theme/onlyfans/images/media_processing_chat.png" width="760" height="500" class="img-responsive"></span>');
      }
    } else {
      var wait = li.find('.msg_body_media .media_processing_chat_message');
      if (wait.length) {
        wait.remove();
      }
      if (message.media.length) {
        if (message.is_free || message.is_opened || message.from.me) {
          var m = $.trim(li.find('.msg_body_media').html());
          if (m == '') {

            switch (message.media[0].type) {
              case 'video':
                media_html = '<div class="video-wrapper">' +
                  '<div class="blurred-poster" style="background-image: url(' + message.media[0].preview + ')"></div>' +
                  '<video controls class="video-js vjs-default-skin" id="chat_message_media_video_' + message.id + '" poster="' + message.media[0].preview + '">' +
                  '<source type="video/mp4" src="' + message.media[0].src + '">' +
                  '</video>' +
                  '</div>';
                li.find('.msg_body_media').addClass('msg_body_media-' + message.media[0].type).html(media_html);
                videojs('#chat_message_media_video_' + message.id);
                break;
              case 'gif':
                var width = '',
                  height = '';
                if (message.media[0].preview_width && message.media[0].preview_height) {
                  width = ' width=' + message.media[0].preview_width;
                  height = ' height=' + message.media[0].preview_height;
                }
                media_html = '<div class="gif-player"><img data-full="' + message.media[0].src + '" onerror="chatImageBroken(this)" src="' + message.media[0].preview + '"' + width + height + ' /></div>';
                li.find('.msg_body_media').addClass('msg_body_media-' + message.media[0].type).html(media_html);
                var gifPlayer = li[0].querySelector('.gif-player');
                $(li).off('inview').on('inview', function (event, isInView) {
                  if (isInView) {
                    playChatGif(gifPlayer);
                  } else {
                    stopChatGif(gifPlayer);
                  }
                });
                break;
              default:
                var width = '',
                  height = '';
                if (message.media[0].preview_width && message.media[0].preview_height) {
                  width = ' width=' + message.media[0].preview_width;
                  height = ' height=' + message.media[0].preview_height;
                }
                media_html = '<a href="' + message.media[0].src + '" target="_blank"><img data-full="' + message.media[0].src + '" onerror="chatImageBroken(this)" src="' + message.media[0].preview + '"' + width + height + ' /></a>';
                li.find('.msg_body_media').addClass('msg_body_media-' + message.media[0].type).html(media_html);
                $('.msg_body_media').magnificPopup({
                  delegate: 'a',
                  type: 'image'
                });
                break;
            }
          }
        }
      } else if (!message.media_count) {
        li.find('.msg_body_media').remove();
      }
    }
    if (message.from.me) {
      var pm = li.find('.msg_body_status .cm_not_paid_message');
      if (!message.is_free) {
        if (!message.is_opened) {
          if (!pm.length) {
            li.find('.msg_body_status').append('<p class="cm_not_paid_message">Message has not been paid to view yet. ' + message.price + '</p>');
          }
        } else {
          if (!pm.length) {
            li.find('.msg_body_status').append('<p class="cm_not_paid_message">Message has been viewed for ' + message.price + '</p>');
          }
        }
      } else {
        if (pm.length) {
          pm.remove();
        }
      }
    } else {
      var pm = li.find('.msg_body_status .cm_paid_message');
      if (!message.is_free && !message.is_opened) {
        if (!pm.length) {
          li.find('.msg_body_status').append('<a href="#" class="cm_paid_message">Pay ' + message.price + ' to unlock</a>');
        }
      } else {
        if (pm.length) {
          pm.remove();
        }
      }
    }
    if (!message.from.me && !message.is_free && !message.is_opened) {
      if (message.media_count || !message.is_media_ready) {
        li.addClass('paid-with-media');
        if(message.media.length && message.media[0] && message.media[0].duration_sec) {
          var formattedDuration = formatDuration(message.media[0].duration_sec);
          li.find('.msg_body_status .cm_paid_message').append('<span class="video-duration">' + formattedDuration + '</span>');
        }
      } else {
        li.addClass('paid-without-media');
      }
    }
    if( message.is_tips ) {
      li.addClass('is_tips');
    }
    if (message.from.me || message.is_free || (!message.is_free && message.is_opened) || (!message.is_free && message.media_count)) {
      li.find('.msg_body').html(message.text);
    }
    if (message.last_changed_time > CHAT_LAST_TIME) {
      CHAT_LAST_TIME = message.last_changed_time;
    }
    if (!old.length && ('undefined' === no_scroll || !no_scroll)) {
      setTimeout(function () {
        $('.chat-body').stop().scrollTop($('.chat-body')[0].scrollHeight);
      }, 300);
    }
    if (!message.from.me) {
      if (message.is_new) {
        $(li).off('inview').on('inview', function (event, isInView) {
          if (isInView) {
            $(li).off('inview');
            sendChatMessageReadState(message.from.id, message.id);
            message.is_new = false;
          }
        });
      }
    } else {
      if (!message.is_new) {
        li.addClass('viewed');
      }
    }
  }
}

function formatDuration(duration) {
  var sec_num = parseInt(duration, 10);
  var hours   = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);
  duration = '';
  if (seconds) {duration = seconds + 's';}
  if (minutes) {duration = minutes + 'm' + duration;}
  if (hours) {duration = hours + 'h' + duration;}
  return duration;
}

function sendChatMessageReadState(chat_user_id, chat_message_id) {
  var data = {
    act: 'readchat',
    chat_user_id: chat_user_id,
    chat_message_id: chat_message_id
  };
  sendToSocket(data);
}

function sendToSocket(data) {
  if ('undefined' === typeof data || 'undefined' === typeof data.act || !data.act.length) {
    return;
  }
  var sess = $.cookie('sess');
  if ('undefined' !== typeof sess && sess) {
    data.sess = sess;
  }
  if ('undefined' !== typeof ws && ws && ws.readyState === ws.OPEN) {
    try {
      ws.send(JSON.stringify(data));
    } catch (e) {

    }
  } else {
    SOCKETQUEUE.push(data);
  }
}

function sendChatTypingState(to_user) {
  var data = {
    act: 'typing',
    typing_to: to_user,
    typing_from_name: USERNAME,
    typing_from_id: USERID
  };
  sendToSocket(data);
}

function updateChatMessages(only_new) {
  if (CHAT_ACTIVE) {
    CHAT_ACTIVE = false;

    $.post('/component/chat/post/last_messages', {
      user: CHAT_USER,
      offset: only_new ? 0 : $('.chat_message:not(.chat-is-typing)').length,
      limit: only_new ? 1 : 10
    }, function (data) {
      for (var i in data.list) {
        showChatMessage(data.list[i], !only_new);
      }
      CHAT_ACTIVE = true;
    }, 'json');
  }
}

function showComment(list_obj, comment) {
  if (!list_obj.find('.comments_item[comment_id="' + comment.id + '"]').length) {
    var text = '<div class="media comments_item" comment_id="' + comment.id + '">\n\
			<a class="pull-left" href="' + comment.user.url + '">\n\
			<img class="media-object" src="' + comment.user.avatar + '" alt="' + comment.user.name + '">\n\
			</a>\n\
			<div class="media-body">\n\
			<div class="comment-heading">\n\
			<span class="comment_author">' + comment.user.name + '</span>\n\
			<span class="comment_date">' + comment.date + '</span>\n\
			</div>\n\
			' + comment.text + '\
			</div>\n\
			<a href="#" class=comments_like_button>0</a>\n\
			<a href="#" class="comments_answer_button">Reply</a>\n\
			</div>';
    list_obj.append(text);
    $(window).trigger('post_comment_added');
  }
}

function postsRowGrid() {
  $(".post_thumbs").rowGrid({itemSelector: ".post_img", minMargin: 4, maxMargin: 4});
}

function photosRowGrid() {
  $(".photos_list").rowGrid({itemSelector: ".photo_img", minMargin: 4, maxMargin: 4});
}

function applyPrettyPhoto() {
  $("a[rel^='prettyPhoto']").prettyPhoto({
    social_tools: "",
    deeplinking: false
  });
}

function applyGifPlayer() {
  $('.gifplayer').gifplayer();
}

function reloadChats() {
  $.post('/component/chats/post/list', {}, function (data) {
    $('#chats_modal .modal-body').html(data);
  });
}

$(function () {
  $('a[data-toggle="modal"]').click(function () {
    modal_add_data = $(this).attr('add-data');
    var fnc = $(this).attr('open-function');
    if (fnc) {
      eval(fnc);
    }
  });

  $('body').on('click', '.show_more_button', function () {
    var me = $(this);
    var cont = me.parents('.show_more_container');
    $.post('/component/entities/post/more', {
      'data': me.attr('data-more')
    }, function (data) {
      $(data).insertAfter(cont);
      var fnc = me.attr('onAfterLoadMore');
      cont.remove();
      if (fnc) {
        eval(fnc);
      }
    });
  });
});

function number_format(number, decimals, dec_point, thousands_sep) {

  number = (number + '')
    .replace(/[^0-9+\-Ee.]/g, '');
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    toFixedFix = function (n, prec) {
      var k = Math.pow(10, prec);
      return '' + (Math.round(n * k) / k)
        .toFixed(prec);
    };
  // Fix for IE parseFloat(0.55).toFixed(0) = 0;
  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
    .split('.');
  if (s[0].length > 3) {
    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
  }
  if ((s[1] || '')
    .length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1)
      .join('0');
  }
  return s.join(dec);
}


function setModalMaxHeight(element) {
  this.$element = $(element);
  this.$content = this.$element.find('.modal-content');
  var borderWidth = this.$content.outerHeight() - this.$content.innerHeight();
  var dialogMargin = $(window).width() < 768 ? 20 : 60;
  var contentHeight = $(window).height() - (dialogMargin + borderWidth);
  var headerHeight = this.$element.find('.modal-header').outerHeight() || 0;
  var footerHeight = this.$element.find('.modal-footer').outerHeight() || 0;
  var maxHeight = contentHeight - (headerHeight + footerHeight);

  this.$content.css({
    'overflow': 'hidden'
  });

  this.$element
    .find('.modal-body').css({
    'max-height': maxHeight,
    'overflow-y': 'auto'
  });
}

function getMediaTypeByName(filename) {
  for (var e in POST_MEDIA_CONFIG.ext) {
    var re = eval('/\\.(' + POST_MEDIA_CONFIG.ext[e] + ')$/i');
    if (re.test(filename)) {
      return e;
    }
  }
}

function loadPostComments(post) {
  var cont = post.find('.comments_container');
  $.post('/component/comments/post/load', {
    table: post.attr('item_table'),
    item: post.attr('item_id')
  }, function (data) {
    cont.html(data);
    $(window).trigger('post_comments_loaded');
  });
}

function showLoginCaptcha() {
  LOGIN_CAPTCHA = true;
  gRecaptchaExpired();
  var wrap = $('.captcha_wrapper');
  var cont = '<div class="g-recaptcha" data-expired-callback="gRecaptchaExpired" data-callback="gRecaptchaSuccess" data-sitekey="' + RECAPTCHA_PUBLIC + '"></div><script type="text/javascript" src="https://www.google.com/recaptcha/api.js"></script>';
  wrap.html(cont);
}

function hideLoginCaptcha() {
  LOGIN_CAPTCHA = false;
  gRecaptchaSuccess();
  var wrap = $('.captcha_wrapper');
  wrap.html('');
}

function gRecaptchaSuccess() {
  $('#sign_up button[type="submit"]').prop('disabled', !document.querySelector('#agree').checked);
}

function gRecaptchaExpired() {
  $('#sign_up button[type="submit"]').prop('disabled', true);
}

function checkPassword(str) {
  // at least one number, one lowercase and one uppercase letter
  // at least six characters
  var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  return re.test(str);
}

function loadFilesList() {
  $.post('/component/file_choose/post/load', {}, function (data) {
    $('.file_manager_files_list_wrapper').html(data);
  });
}

function humanFileSize(bytes) {
  var thresh = 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  var units = ['K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + '' + units[u];
}

function doSubscribe(user, token) {
  if (typeof token === 'undefined') {
    token = '';
  }
  $.post('/component/subscribe/post/subscribe', {
    user: user,
    token: token
  }, function (data) {
    if (data.result) {
      if (typeof data.redirect !== 'undefined') {
        hidePreloader();
        document.location.href = data.redirect;
      } else {
        hidePreloader();
        alert(data.message);
      }
    } else if (typeof data.need3ds !== 'undefined' && data.need3ds) {
      eval(data.function3ds);
    } else {
      hidePreloader();
      alert(data.message);
    }
  }, 'json');
}

setTimeout(function () {
  if ($('.post_tools a[download]').length) {
    $.post('/component/service/post/dlplgfound');
  }
}, 10000);

function doTips(user_id, post_id, amount, text, token) {
  if (typeof token === 'undefined') {
    token = '';
  }
  $.post('/component/tips/post/send', {
    post: post_id,
    user: user_id,
    amount: amount,
    text: text,
    token: token
  }, function (data) {
    if (data.result) {
      hidePreloader();
      if (typeof data.redirect !== 'undefined') {
        document.location.href = data.redirect;
      } else if (data.message) {
        alert(data.message);
      }
    } else if (typeof data.need3ds !== 'undefined' && data.need3ds) {
      eval(data.function3ds);
    } else {
      hidePreloader();
      alert(data.message);
    }
    $('.send_post_tips_button').removeAttr('disabled');
  }, 'json');
}

function doPayChat(message_id, token) {
  showPreloader();
  if (typeof token === 'undefined') {
    token = '';
  }
  $.post('/component/chat/post/pay', {
    mid: message_id,
    token: token
  }, function (data) {
    if (data.result) {
      hidePreloader();
      if (typeof data.redirect !== 'undefined') {
        document.location.href = data.redirect;
      } else if (data.message) {
        alert(data.message);
      }
    } else if (typeof data.need3ds !== 'undefined' && data.need3ds) {
      eval(data.function3ds);
    } else {
      hidePreloader();
      alert(data.message);
    }
  }, 'json');
}

function reloadPost(pid) {
  var p = $('.user_post_' + pid);
  if (p.length) {
    $.post('/component/post/post/load', {pid: pid}, function (html) {
      $('.user_post_' + pid).replaceWith(html);
    });
  }
}

function signupFormSubmit(event) {
  var form = $(event.target),
    pass_input = form.find('input[name=password]'),
    pass = pass_input.val(),
    pass_error = pass_input.next('.error_place_for_password');
  if (6 > pass.length) {
    event.preventDefault();
    pass_error.html('Minimum password length is 6 characters');
  } else if (!checkPassword(pass)) {
    event.preventDefault();
    pass_error.html('The password must contain at least 1 number, at least 1 lower case letter, and at least 1 upper case letter');
  } else {
    pass_error.html('');
    form.trigger('signup_form_submitted');
  }
}

function checkPass(event) {
  var el = $(event.target),
    val = el.val(),
    pass_error = el.next('.error_place_for_password');
  if (6 > val.length) {
    pass_error.html('Minimum password length is 6 characters');
  } else if (!checkPassword(val)) {
    event.preventDefault();
    pass_error.html('The password must contain at least 1 number, at least 1 lower case letter, and at least 1 upper case letter');
  } else {
    pass_error.html('');
  }
}

function checkPassEqual(event) {
  var el = $(event.target),
    val = el.val(),
    pass_error = el.next('.error_place_for_password2'),
    first_el = el.closest('form').find('#new_password_input'),
    first_val = first_el.val();
  if (val !== first_val) {
    pass_error.show();
  } else {
    pass_error.hide();
  }
}

function updateMenuCount(count, el) {
  if (!el) {
    return;
  }
  if (parseInt(count, 10) > 0) {
    el.textContent = count;
    el.style.display = '';
  } else {
    el.textContent = '';
    el.style.display = 'none';
  }
}

function load_prev_msgs(event) {
  if (300 > event.target.scrollTop) {
    if (CHAT_ACTIVE) {
      CHAT_ACTIVE = false;

      $.post('/component/chat/post/last_messages', {
        user: CHAT_USER,
        offset: $('.chat_message:not(.chat-is-typing)').length,
        limit: 10
      }, function (data) {
        for (var i in data.list) {
          showChatMessage(data.list[i], 1, 1);
          if (0 === event.target.scrollTop) {
            event.target.scrollTop = event.target.scrollTop + $('.chat_message').first().outerHeight();
          }
        }
        if (data.total <= $('.chat_message:not(.chat-is-typing)').length) {
          document.querySelector('.chat-body').removeEventListener('scroll', load_prev_msgs);
        }
        CHAT_ACTIVE = true;
      }, 'json');
    }
  }
}

function chatImageBroken(el) {
  el.src = el.dataset.full;
}

function changePostBtnState() {
  var val = $('#new_post_text_input').val().trim().replace(/(\r\n|\n|\r)/gm, '');
  $('.send_post_button').prop('disabled', !(val.length || $('.make_post_thumb').length));
}

function toggleVotingInputs() {
  $('.new_vote_options').toggleClass('minimal', $('.vote-input').length <= 2).toggleClass('maximal', $('.vote-input').length === 10);
  $('.vote-input').each(function (n) {
    $(this).find('input').attr('placeholder', (n + 1) + '.');
  })
}

function playChatGif(el) {
  var gifImg = el.querySelector('.gif-img');
  if (gifImg) {
    return;
  }
  var gifSrc = el.children[0].dataset.full;
  gifImg = document.createElement('img');
  gifImg.setAttribute('class', 'gif-img');
  gifImg.addEventListener('load', function () {
    var gifImgExisted = el.querySelector('.gif-img');
    if (gifImgExisted) {
      return;
    }
    el.appendChild(gifImg);
  }.bind(this));
  gifImg.setAttribute('src', gifSrc);
}

function stopChatGif(el) {
  var gifImg = el.querySelector('.gif-img');
  if (gifImg) {
    el.removeChild(gifImg);
  }
}

function dateRemaining() {
  var now = moment().unix();
  POSTS_REMAINING.forEach(function (post, i) {
    var postNode = document.querySelector('.user_post_' + post.id),
      postDateNode = postNode.querySelector('.post_date.remaining'),
      expire = moment(post.expire_date + '+00:00');
    if (postDateNode && now < expire.unix()) {
      postDateNode.innerHTML = expire.toNow(true);
    } else {
      POSTS_REMAINING.splice(i, 1);
      postNode.parentNode.removeChild(postNode);
    }
  });
}

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return !!re.test(email);
}