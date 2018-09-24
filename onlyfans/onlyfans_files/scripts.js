'use strict';

//Raven.config('https://9b53e4d1098d491cbe99127e62c6593e@sentry.io/1253481').install();
//Raven.context(function () {

autosize(document.querySelectorAll('textarea.unlimsize'));

$(function () {
  $('.avatar_link img').error(function () {
    $(this).attr({
      src: '/theme/onlyfans/images/default_avatar.png'
    });
  });

  moment.updateLocale('en', {
    relativeTime: {
      future: "in %s",
      past: "%s ago",
      s: 'a few seconds',
      ss: '%ds',
      m: "1m",
      mm: "%dm",
      h: "1h",
      hh: "%dh",
      d: "1d",
      dd: "%dd",
      M: "a month",
      MM: "%d months",
      y: "a year",
      yy: "%d years"
    }
  });
  dateRemaining();
  //setInterval(dateRemaining, 60000);
  if (Fingerprint2) {
    new Fingerprint2({excludeWebGL: true, excludeCanvas: true}).get(function (result, components) {
      StartWS(result);
    });
  }

  $('#now_post_media_files .make_post_thumb .thumb_del').off('click').on('click', function () {
    $(this).parents('.make_post_thumb').remove();
    return false;
  });

  $('.faq-anchors a').on('click', function (event) {
    event.preventDefault();
    var top = $($(this).attr('href')).offset().top - $('#site_header').outerHeight();
    $('html,body').animate({
      scrollTop: top
    }, 300);
  });

  if ($('.init_scroll').length) {
    $('html').scrollTop($('.init_scroll')[0].offsetTop - 50);
  }
  $('.modal').on('show.bs.modal', function () {
    $(this).show();
    setModalMaxHeight(this);
  });
  $('.new_post_scroller').click(function () {
    var input = $('#new_post_text_input');
    if (input.length) {
      $('html').scrollTop(0);
      input.click().focus();
    }
    return false;
  });
  $('.back_to_chat_list').click(function () {
    reloadChats();
  });

  $(window)
    .on('resize', function () {
      if ($('.modal.in').length != 0) {
        setModalMaxHeight($('.modal.in'));
      }
    })
    .on('post_comments_loaded post_comment_added', function () {

      $('.comments_like_button').off('click').on('click', function (event) {
        event.preventDefault()
        var me = $(this),
          comment_id = me.closest('.comments_item').attr('comment_id'),
          url = me.hasClass('active') ? 'unlike' : 'like';

        $.post('/component/comments/post/' + url, {cid: comment_id}, function (response) {
          console.log(response);
          if ('undefined' !== typeof response.count) {
            me.text(response.count).toggleClass('active');
          }
        });
      })
    })
    .on('ws_opened', function () {
      if (SOCKETQUEUE.length) {
        SOCKETQUEUE.forEach(function (item, i) {
          sendToSocket(item);
          SOCKETQUEUE.splice(i, 1);
        });
      }
    });

  var chat_message_text_input_val;

  $('body')
    .on('inview', '.show_more_button_infinite', function (event, isInView) {
      if (isInView) {
        $(this).click().off('inview');
      }
    })
    .on('inview', '.gifplayer', function (event, isInView) {
      if (isInView) {
        $(this).gifplayer('play');
      } else {
        $(this).gifplayer('stop');
      }
    })
    .on('click', '.action_subscribe_button', function () {
      showPreloader();
      var me = $(this),
        user = me.data('user');
      me.attr('disabled', 'disabled');
      doSubscribe(user);
      return false;
    })
    .on('click', '.action_unsubscribe_button', function () {
      var me = $(this);
      my_dialog({
        title: 'Unsubscribe',
        message: 'Are you sure you want to cancel subscription?',
        form: [{
          type: 'select',
          title: 'Reason for cancellation:',
          name: 'reason',
          list: UNSUBSCRIBE_REASONS
        }],
        buttons: [{
          title: 'YES',
          onclick: function () {
            me.attr('disabled', 'disabled');
            $.post('/component/subscribe/post/unsubscribe', {
              user: me.data('user'),
              reason: $('#dialog .field_reason').val()
            }, function () {
              reloadPage();
            });
            my_dialog_close();
          }
        }]
      });
      return false;
    })
    .on('click', '.action_resubscribe_button', function () {
      var me = $(this);
      my_confirm('Resubscribe', 'Are you sure you want to re-subscribe?', function () {
        me.attr('disabled', 'disabled');
        $.post('/component/subscribe/post/resubscribe', {
          user: me.data('user')
        }, function () {
          reloadPage();
        });
      });
      return false;
    })
    .on('click', '.send_post_tips_button', function () {
      showPreloader();
      all_modals_close();
      var me = $(this),
        modal = $(this).parents('.modal'),
        arr = modal_add_data.split('|'),
        post_id = arr[0],
        user_id = arr[1],
        amount = modal.find('.tips_amount_input').val(),
		    text = modal.find('.tips_text_input').val();
      me.prop('disabled', true);
      doTips(user_id, post_id, amount, text);
      return false;
    })
    .on('click', '.delete_post_button', function () {
      var me = $(this);
      my_dialog({
        title: 'Delete post',
        buttons: [{
          title: 'Yes, delete',
          class: 'btn-default',
          onclick: function () {
            $.post('/component/post/post/delete', {
              post: me.attr('post_id')
            }, function () {
              my_dialog_close();
              me.parents('.user_post').remove();
            });
          }
        }]
      });
      return false;
    })
    .on('click', '.toggle_post_pin_button', function () {
      var me = $(this),
        pw = me.parents('.user_post');
      pw.toggleClass('user_post_pinned');
      me.text(!pw.hasClass('user_post_pinned') ? 'Pin to your profile page' : 'Unpin from your profile page');
      $.post('/posts/pin_toggle', {
        post: me.attr('post_id')
      }, function (data) {
        switch (data) {
          case '1':
            if (!pw.hasClass('user_post_pinned')) {
              pw.addClass('user_post_pinned');
              me.text('Unpin from your profile page');
            }
            break;
          case'0':
            if (pw.hasClass('user_post_pinned')) {
              pw.removeClass('user_post_pinned');
              me.text('Pin to your profile page');
            }
            break;
        }
      });
      return false;
    })
    .on('click', '.send_post_report_button', function () {
      var post_id = modal_add_data,
        r = $(this).parents('.modal').find('.input_report_reason:checked');
      if (r.length) {
        var text = r.val();
        $.post('/component/report/post/send_for_post', {
          post: post_id,
          text: text
        }, function (data) {
          all_modals_close();
          if (data === '1') {
            alert('Report was sent success');
          }
        });
      } else {
        alert('Not selected reason');
      }
      return false;
    })
    .on('click', '.favorites_button', function () {
      var me = $(this),
        post_id = me.attr('post_id');

      $.post('/component/favorite/post/toggle', {
        post: post_id
      }, function (data) {
        if ('undefined' !== typeof data.count) {
          me.text(data.count).closest('li').toggleClass('favorited_active');
          me.attr({
            title: me.closest('li').is('.favorited_active') ? 'Unlike' : 'Like'
          })
        }
      });
      return false;
    })
    .on('click', '.refresh_comments_button', function () {
      loadPostComments($(this).parents('.user_post'));
      return false;
    })
    .on('click', '.delete_comment_button', function () {
      var me = $(this);
      my_confirm('Delete comment', 'Are you sure?', function () {
        var wrap = me.parents('.comments_item'),
          cid = wrap.attr('comment_id');
        $.post('/component/comments/post/delete', {
          'cid': cid
        }, function () {
          wrap.remove();
        });
      });
      return false;
    })
    .on('click', '.new_vote_add_option', function () {
      var me = $(this),
        wrap = me.parents('#new_post_voting_block'),
        options = wrap.find('.new_vote_options'),
        cont = '<div class="vote-input"><input class=form-control name=voting_options[]><button type="button" class="delete-vote-option"></button></div>';
      options.append(cont);
      toggleVotingInputs();
      return false;
    })
    .on('click', '.delete-vote-option', function () {
      $(this).closest('.vote-input').remove();
      toggleVotingInputs();
    })
    .on('click', '.new_vote_remove', function () {
      var me = $(this),
        wrap = me.parents('#new_post_voting_block'),
        options = wrap.find('.new_vote_options');
      options.find('input').val('');
      wrap.hide();
      return false;
    })
    .on('click', '.post_voting_option', function () {
      var me = $(this),
        voting_wrapper = me.parents('.post_voting');
      $.post('/component/post_voting/post/vote', {
        pid: voting_wrapper.attr('post_id'),
        oid: me.attr('option_id')
      }, function (html) {
        var wrap = voting_wrapper.wrap('<div />');
        wrap.html(html);
      });
      return false;
    })
    .on('click', '.comments_btn', function () {
      var post = $(this).closest('.user_post'),
        cont = post.find('.comments_container');
      cont.toggle();
      $(this).attr({
        title: cont.is(':visible') ? 'Hide comments' : 'Show comments'
      });
      if ('' === cont.text()) {
        loadPostComments(post);
      }
      return false;
    })
    .on('keyup', '.chat_message_text_input', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13 || e.keyCode === 10)) {
        $('.chat_send_button').trigger('click');
      }
    })
    .on('input', '.chat_message_text_input', $.throttle(3000, function () {
      var val = $('.chat_message_text_input').val().trim().replace(/(\r\n|\n|\r)/gm, '');
      if (val.length && chat_message_text_input_val !== val) {
        chat_message_text_input_val = val;
        sendChatTypingState(CHAT_USER);
      }
    }))
    .on('click', '.chat_send_button', function (event) {
      event.preventDefault();
      var me = $(this),
        wrap = me.closest('#chat_modal').length ? me.closest('#chat_modal') : me.closest('.step2'),
        err = wrap.find('.error'),
        textInput = wrap.find('.chat_message_text_input'),
        text = $.trim(textInput.val()),
        media_input = $('#new_chat_message_media_files input[name="media"]'),
        media = media_input.length > 0 ? media_input.val() : '',
        price = $('.cm_set_message_block_button_opened').length ? $('.cm_set_message_price_input').val() : 0,
        disabled = true;
      err.html('');
      if (text || media) {
        me.prop('disabled', disabled);
        setTimeout(function () {
          disabled = false;
          me.prop('disabled', disabled);
        }, 5000);
        if (me.closest('form').length) {
          me.closest('form').submit();
          return false;
        }
        CHAT_ACTIVE = false;
        wrap.addClass('processing');
        $.post('/component/chat/post/send', {
          to: CHAT_USER,
          text: text,
          media: media,
          price: price
        }, function (data) {
          wrap.removeClass('processing');
          if (data.success) {
            showChatMessage(data);
            textInput.val('');
            autosize.update(textInput);
            if (price) {
              localStorage.setItem('messagePrice', price);
              $('.cm_set_message_price_button').trigger('click');
            }
            $('#new_chat_message_media_files').html('');
            CHAT_LAST_TIME = 0;
          } else {
            err.html(data.error);
          }
          CHAT_ACTIVE = true;
        }, 'json');
      }
      return false;
    })
    .on('click', 'a.cm_paid_message', function () {
      var me = $(this),
        wrap = me.parents('.msg_body_status'),
        cont = '<span class=cm_paid_message>Confirm payment <button type=button class="btn btn-default btn-sm cm_paid_message_pay">Pay ' + me.parents('.chat_message').attr('price') + '</button><div class=cm_payment_error></div></span>';
      wrap.html(cont);
      return false;
    })
    .on('click', '.cm_paid_message_pay', function () {
      if (CAN_PAY) {
        doPayChat($(this).closest('.chat_message').attr('message_id'));
      } else {
        alert('Payment could not be processed, please re-add your card with 3D secure verification or contact support at <a href="mailto:support@onlyfans.com">support@onlyfans.com</a>');
      }
      return false;
    })
    .on('click', '.comments_answer_button', function () {
      var me = $(this),
        wrap = me.parents('.comments_wrapper'),
        comment_id = me.parents('.comments_item').attr('comment_id'),
        text_input = wrap.find('.comment_text_input');
      wrap.find('.comments_answer_to_input').val(comment_id);
      text_input.val(me.parents('.comments_item').find('.comment_author').text() + ', ' + text_input.val()).focus();
      return false;
    })
    .on('click', '.comment_send_button', function () {
      var me = $(this),
        wrap = me.parents('.comments_wrapper'),
        err = wrap.find('.error'),
        text_input = wrap.find('.comment_text_input'),
        answerto_input = wrap.find('.comments_answer_to_input'),
        text = $.trim(text_input.val()),
        answerto = answerto_input.val();
      err.html('');
      if (text) {
        $.post('/component/comments/post/send', {
          table: wrap.attr('table'),
          item: wrap.attr('item'),
          text: text,
          answer_to: answerto
        }, function (data) {
          if (data.success) {
            text_input.val('');
            answerto_input.val('');
            showComment(wrap.find('.comments_list'), data);
            wrap.parents('.post_body').find('.post_comments_count').html(data.entity.comments_count);
          } else {
            err.html(data.error);
          }
        }, 'json');
      }
      return false;
    })
    .on('click', '.refresh_subscribe_offers_button', function () {
      var me = $(this),
        wrap = me.parents('.quatro-recommended').find('.subscribe_offers_list');
      $.post('/component/subscribe_offers/post/reload', {}, function (data) {
        wrap.html(data);
        Swiper('.recommended-slider', {
          direction: 'vertical',
          loop: false,
          nextButton: '.swiper-button-next',
          prevButton: '.swiper-button-prev',
          breakpoints: {
            1200: {
              direction: 'horizontal'
            }
          }
        });
      });
      return false;
    })
    .on('click', '.showall_subscribe_offers_button', function () {
      var me = $(this);
      me.parents('.panel').find('.who_to_subscribe_list .panel').show();
      return false;
    })
    .on('contextmenu', 'video', function () {
      return false;
    })
    .on('contextmenu', 'img', function () {
      return false;
    })
    .on('dragstart', 'img', function (e) {
      e.preventDefault();
      return false;
    })
    .on('dragstart', 'a', function (e) {
      e.preventDefault();
      return false;
    })
    .on('click', '.cm_set_message_price_button', function (event) {
      event.preventDefault();
      $('.chat-footer__inner').toggleClass('with-price');
      $('.cm_set_message_price_block').toggle();
      $('.cm_set_message_price_button').toggleClass('cm_set_message_block_button_opened');
      var price_input = $('.cm_set_message_price_input'),
        wrap = $('#chat_modal').length ? $('#chat_modal') : $('.step2'),
        err = wrap.find('.error');
      if ($('.cm_set_message_price_button').is('.cm_set_message_block_button_opened')) {
        var savedPrice = localStorage.getItem('messagePrice');
        if (savedPrice) {
          price_input.val(savedPrice);
        } else {
          price_input.val(price_input.attr('min'));
        }
        price_input.trigger('input').trigger('focusout');
        if (!$('#new_chat_message_media_files .make_post_thumb').length) {
          err.html('Please attach media to your paid message');
          //document.querySelector('.chat_send_button').disabled = true;
        }
      } else {
        price_input.val('');
        err.html('');
        //document.querySelector('.chat_send_button').disabled = false;
      }
    })
    .on('click', '.clear_chat_button', function () {
      var me = $(this);
      my_confirm('Messages', 'Are you sure to clear messages?', function () {
        $.post('/component/chat/post/clear', {
          cid: me.parents('li').attr('chat_id')
        }, function () {
          reloadChats();
        });
      });
      return false;
    })
    .on('input', '.cm_set_message_price_input,.tips_amount_input', function (event) {
      var el = event.target,
        val = el.value.length ? el.value.trim().replace(/[^0-9.]+$/, '') : '';
      if ('.' === val) {
        val = '0.';
      }
      el.value = val;
    })
    .on('focusout', '.cm_set_message_price_input,.tips_amount_input', function (event) {
      var el = event.target,
        val = el.value.length ? parseFloat(el.value) : 0,
        min = parseFloat(el.getAttribute('min')),
        max = parseFloat(el.getAttribute('max'));
      if (val < min) {
        val = min
      }
      if (val > max) {
        val = max
      }
      el.value = val.toFixed(2);
    })
    .on('input', '#new_post_text_input', changePostBtnState)
    .on('click', '.show-more-earnings', function () {
      $(this).hide();
      $('.earnings_sidebar_row-more_wrapper').slideDown();
    })
    .on('click', '.btn-unsend', function () {
      var btn = $(this),
        message = btn.closest('.chat_message'),
        mid = message.attr('message_id');
      my_dialog({
        title: 'Are you sure?',
        buttons: [{
          title: 'Yes, unsend',
          class: 'btn-default',
          onclick: function () {
            $.post('/component/chat/post/unsend', {
                mid: mid
              },
              function (response) {
                if (response) {
                  message.remove();
                }
              }
            ).always(function () {
              my_dialog_close();
            });
          }
        }]
      });
    })
    .on('click', '.btn-unsend-group', function () {
      var btn = $(this),
        message = btn.closest('.chat_pending_count_wrapper'),
        qid = btn.data('qid');
      my_dialog({
        title: 'Are you sure?',
        buttons: [{
          title: 'Yes, unsend',
          class: 'btn-default',
          onclick: function () {
            $.post('/my/chats/unsend_queue', {
                qid: qid
              },
              function (response) {
                if (response) {
                  message.remove();
                  reloadChats();
                }
              }
            ).always(function () {
              my_dialog_close();
            });
          }
        }]
      });
    });

  var chatBody = document.querySelector('.chat-body');
  if (chatBody) {
    chatBody.addEventListener('scroll', load_prev_msgs);
  }

  $('.invite_button').click(function () {
    var wrap = $(this).parents('.invite_wrapper'),
      email_input = wrap.find('.invite_email');
    $.post('/component/invite_user/post/send', {
      email: email_input.val()
    }, function (data) {
      if (data.success) {
        email_input.val('');
      }
      alert(data.message);
    }), 'json';
    return false;
  });
  $('.tip-bottom').tooltip({
    placement: 'bottom'
  });
  $('.tip-top').tooltip({
    placement: 'top'
  });
  $('[data-toggle="popover"]').popover();
  $('.make_post_additional_btn').click(function () {
    $('.make_post_additional').toggleClass('shown');
    return false;
  });
  $('input.datepicker').datepicker({
    format: "mm/dd/yyyy",
    weekStart: 1,
    startView: 2,
    autoclose: true
  });
  $(".alert").alert();
  reinitAlerts();
  $('#change_avatar form, #change_background form').submit(function () {
    showPreloader();
  });
  $('.send_post_button, .fanscope_create_button').click(function () {
    showPreloader();
  });
  var post_media_type = 'undefined' !== typeof NEW_POST_MEDIA_TYPE && '' !== NEW_POST_MEDIA_TYPE ? NEW_POST_MEDIA_TYPE : undefined,
    upload_count = $('#now_post_media_files .make_post_thumb').length,
    current_media_type;
  $('#fileupload_photo').fileupload({
    url: '/component/upload/post/upload',
    dataType: 'json',
    maxFileSize: 4294967296,
    maxChunkSize: 10000000,
    dropZone: $('#make_post_form'),
    singleFileUploads: false,
    submit: function () {
      $('.send_post_button').prop('disabled', true);
    },
    add: function (e, data) {
      $('.send_post_button').prop('disabled', true);
      var upload = false;
      if (current_media_type = getMediaTypeByName(data.files[0].name)) {
        if (!post_media_type) {
          post_media_type = current_media_type;
          upload = true;
        } else if (post_media_type === current_media_type && upload_count < POST_MEDIA_CONFIG.count[post_media_type]) {
          upload = true;
        }
        if (upload) {
          data.submit();
          upload_count++;
          if (upload_count < POST_MEDIA_CONFIG.count[post_media_type]) {
            $('.attach_file_photo').removeClass('disabled').find('input').prop('disabled', false);
            $('.gif_upload,.yotube_upload,.mp3_upload').removeClass('disabled');
          } else {
            $('.attach_file_photo').addClass('disabled').find('input').prop('disabled', true);
            $('.gif_upload,.yotube_upload,.mp3_upload').addClass('disabled');
          }
        } else {
          $('<p/>').text('You can\'t add this file: ' + data.files[0].name).appendTo('#now_post_media_files_error');
        }
      } else {
        $('<p/>').text('Unsupported filetype: ' + data.files[0].name).appendTo('#now_post_media_files_error');
      }
    },
    start: function () {
      $('#new_post_text_input').attr('placeholder', 'Compose post...');
      $('#progress').show();
      $('.send_post_button').prop('disabled', true);
    },
    done: function (e, data) {
      $.each(data.result.files, function (index, file) {
        if (typeof file.error === 'undefined') {
          if (typeof file.thumbUrl !== 'undefined' && !!file.thumbUrl) {
            if ('video' === getMediaTypeByName(file.name)) {
              file.thumbUrl += '.jpg';
            }
            var thumb = $('<div class=make_post_thumb>\n\
<input type=hidden name=media[name][] value="' + file.name + '">\n\
<input type=hidden name=media[tmp_name][] value="' + file.url + '">\n\
<img src="' + file.thumbUrl + '">\n\
<a href="#" class=thumb_del>\n\
<i class="fa fa-times"></i>\n\
</a>\n\
</div>').appendTo('#now_post_media_files');
            $('#now_post_media_files .make_post_thumb .thumb_del').off('click').on('click', function () {
              $(this).parents('.make_post_thumb').remove();
              upload_count--;
              if (upload_count < POST_MEDIA_CONFIG.count[post_media_type]) {
                $('.attach_file_photo').removeClass('disabled').find('input').prop('disabled', false);
                $('.gif_upload,.yotube_upload,.mp3_upload').removeClass('disabled');
              } else {
                $('.attach_file_photo').addClass('disabled').find('input').prop('disabled', true);
                $('.gif_upload,.yotube_upload,.mp3_upload').addClass('disabled');
              }
              if (!$('#now_post_media_files .make_post_thumb').length) {
                post_media_type = undefined;
              }
              changePostBtnState();
              return false;
            });
            thumb.off('click');
            var bpl = $('#new_post_tweet_send_image_blur_preview');
            if (bpl.length > 0) {
              if (bpl.attr('href') === '#') {
                bpl.attr('href', '/component/make_post/post/blur/?image=' + file.url);
                bpl.parents('span').show();
                $('#new_post_tweet_send_image_path').val(file.url);
              }
            }
          } else {
            $('<p/>').text(file.name).appendTo('#now_post_media_files');
            $('<input type=hidden name=media[name][] value="' + file.name + '">').appendTo('#now_post_media_files');
            $('<input type=hidden name=media[tmp_name][] value="' + file.url + '">').appendTo('#now_post_media_files');
            var bpl = $('#new_post_tweet_send_image_blur_preview');
            if (bpl.length > 0) {
              bpl.attr('href', '#');
              bpl.parents('span').hide();
              $('#new_post_tweet_send_image_path').val('');
            }
          }
        } else {
          $('<p/>').text(file.error + ': ' + file.name).appendTo('#now_post_media_files_error');
        }
      });
      changePostBtnState();
      $('#progress').hide().find('.progress-bar').css(
        'width', '0%'
      );
    },
    progressall: function (e, data) {
      var progress = Math.max(parseInt(data.loaded / data.total * 100, 10), 1);
      $('#progress .progress-bar').css(
        'width',
        progress + '%'
      );
    }
  }).prop('disabled', !$.support.fileInput)
    .parent().addClass($.support.fileInput ? undefined : 'disabled');
  $('#chat_modal').on('hide.bs.modal', function (e) {
    stopChat();
  });
  $('#new_post_modal').on('hide.bs.modal', function (e) {
    $('#now_post_media_files').text('');
    $('#progress .progress-bar').css('width', '0%');
    $('#new_post_text_input').val('');
    $('#new_post_available_only_for_subscribe_users').prop('checked', true);
  });
  $('select').chosen({disable_search_threshold: 10});
  $('input.input_file[type=file]').change(function () {
    $(this).next('span.val').text($(this).val().split('/').pop().split('\\').pop());
  });

  $('#search_popover').on('shown.bs.popover', function () {
    if ($('.popover #search_field').length) {
      var users = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        limit: 10,
        prefetch: {
          cache: false,
          url: '/component/search_user/post/get_list'
        },
        ttl: 600000
      });
      $(".popover #search_field").typeahead(null, {
        displayKey: 'name',
        source: users.ttAdapter()
      }).on('typeahead:selected', function (e, d) {
        if (typeof d.url !== 'undefined') {
          document.location.href = d.url;
        } else {
          document.location.href = '/id' + d.id;
        }
      });
    }
  });
  $('.file_manager_files_list_wrapper').on('click', '.filemanager_select_file_button', function () {
    var me = $(this),
      ufid = me.attr('file_id'),
      filename = me.text();
    $('<p/>').text(filename).appendTo('#now_post_media_files');
    $('<input type=hidden name=media[name][] value="' + filename + '">').appendTo('#now_post_media_files');
    $('<input type=hidden name=media[tmp_name][] value="' + ufid + '">').appendTo('#now_post_media_files');
    $('#filemanager button.close').click();
    return false;
  });

  $('.go_dashboard_from_new_post_from_button').click(function () {
    var me = $(this),
      form = $('#make_post_form');
    if (form.length > 0) {
      var text = $('#new_post_text_input').val(),
        attaches = $('#now_post_media_files').html();
      $.post('/component/make_post/post/save_temp', {
        text: text,
        attaches: attaches
      }, function () {
        document.location.href = me.attr('href');
      });
      return false;
    }
  });
  setInterval(function () {
    var list = $('.looker_ping');
    if (list.length) {
      list.each(function () {
        var me = $(this);
        $.get(me.attr('ping'));
      });
    }
  }, 5000);
  $('#cm_fileupload_photo').fileupload({
    url: '/component/upload/post/upload',
    dataType: 'json',
    maxFileSize: 4294967296,
    maxChunkSize: 10000000,
    dropZone: $('#chat_modal'),
    submit: function () {

    },
    start: function () {
      $('#cm_progress').show();
      $('.chat_send_button').prop('disabled', true);
    },
    done: function (e, data) {
      if (0 < data.result.files.length) {
        var file = data.result.files[0],
          files = $('#new_chat_message_media_files'),
          wrap = $('#chat_modal').length ? $('#chat_modal') : $('.step2'),
          err = wrap.find('.error');
        if (typeof file.error === 'undefined') {
          if (typeof file.thumbUrl !== 'undefined' && !!file.thumbUrl) {
            if ('video' === getMediaTypeByName(file.name)) {
              file.thumbUrl += '.jpg';
            }
            files.html('<div class=make_post_thumb>\n\
                        <input type=hidden name=media value="' + file.name + '">\n\
<img src="' + file.thumbUrl + '"/>\n\
<a href="#" class=thumb_del>\n\
<i class="fa fa-times"></i>\n\
</a>\n\
</div>');
            document.querySelector('.chat_send_button').disabled = false;
            err.html('');
            $('#new_chat_message_media_files .make_post_thumb .thumb_del').off('click').on('click', function () {
              $(this).parents('.make_post_thumb').remove();
              if (!$('#new_chat_message_media_files .make_post_thumb').length) {
                if ($('.cm_set_message_price_input').val()) {
                  err.html('Please attach media to your paid message');
                  //document.querySelector('.chat_send_button').disabled = true;
                }
              } else {
                err.html('');
                //document.querySelector('.chat_send_button').disabled = false;
              }
              return false;
            });
          } else {
            files.html('<input type=hidden name=media value="' + file.name + '">' + file.name);
            err.html('');
            document.querySelector('.chat_send_button').disabled = false;
          }
        } else {
          files.html(file.error + ': ' + file.name);
          if (!$('#new_chat_message_media_files .make_post_thumb').length) {
            if ($('.cm_set_message_price_input').val()) {
              err.html('Please attach media to your paid message');
              //document.querySelector('.chat_send_button').disabled = true;
            }
          } else {
            err.html('');
            //document.querySelector('.chat_send_button').disabled = false;
          }
        }
        $('#cm_progress').hide();
        $('#cm_progress .progress-bar').css(
          'width',
          '0%'
        );
      }
    },
    progressall: function (e, data) {
      var progress = parseInt(data.loaded / data.total * 100, 10);
      $('#cm_progress .progress-bar').css(
        'width',
        progress + '%'
      );
    }
  }).prop('disabled', !$.support.fileInput)
    .parent().addClass($.support.fileInput ? undefined : 'disabled');
  if ($('.post_tools a[download]').length) {
    $.post('/component/service/post/dlplgfound');
  }
});
onPing(function (data) {
  if (typeof data.post_updated !== 'undefined') {
	  reloadPost(data.post_updated);
  }
  if (typeof data.chat_messages !== 'undefined') {
    var el = document.querySelector('.new_messages_count');
    updateMenuCount(data.chat_messages, el);
  }
  if (typeof data.chat_message !== 'undefined') {
    showChatMessage(data.chat_message);
  }
  if (typeof data.messages !== 'undefined') {
    var el = document.querySelector('.new_notifications_count');
    updateMenuCount(data.messages, el);
  }
  if (typeof data.online !== 'undefined') {
    $('.online_status_class.online').removeClass('online');
    ONLINE = data.online;
    if (data.online) {
      for (var i in data.online) {
        if (data.online[i]) {
          $('.online_status_class[user_id=' + data.online[i] + ']').addClass('online');
        }
      }
    }
  }
  if (typeof data.readchat !== 'undefined') {
    $('.chat_message[message_id="' + data.readchat.chat_message_id + '"]').addClass('viewed')
  }
  if (typeof data.toasts !== 'undefined' && data.toasts && data.toasts.length > 0) {
	if (SECTION != 'personal' && SUBSECTION != 'chats') {
		for (var i in data.toasts) {
		  $.toast({
			heading: data.toasts[i].title,
			text: data.toasts[i].text,
			showHideTransition: 'slide',
			hideAfter: false
		  });
		}
	}
  }

  if (typeof data.post_expire !== 'undefined') {
    let postNode = document.querySelector('[item_id="' + data.post_expire + '"]');
    if (postNode) {
      let id = post.getAttribute('item_id'),
        postIndex = POSTS_REMAINING.find(function (post) {
          return post.id === id;
        });
      postNode.parentNode.removeChild(postNode);
      if (undefined !== postIndex) {
        POSTS_REMAINING.splice(POSTS_REMAINING[POSTS_REMAINING.indexOf(postIndex)], 1);
      }
    }
  }

  if ('undefined' !== typeof data.chat_message_delete) {
    $('.chat_message[message_id="' + data.chat_message_delete + '"]').remove();
    reloadChats();
  }

  if ('undefined' !== typeof data.typing && 'undefined' !== typeof data.typing.id && 'undefined' !== typeof data.typing.name) {

    var msg = '<em class=chat-is-typing>is typing<span class="hellip-animate">...</span></em>';
    if (data.typing.id === CHAT_USER) {
      msg = '<li class="chat_message chat-is-typing">\n\
							<a class="profile_link online_status_class online">\n\
								<img class="avatar" src="' + CHAT_USER_AVATAR + '" />\n\
							</a>\n\
							<div class="msg_body_wrapper">\n\
								<div class="msg_body_inner">\n\
									<div class="msg_body">' + data.typing.name + ' is typing<span class="hellip-animate">...</span></div>\n\ ';

      msg += '</div>\n\
							</div>\n\
						</li>';
      if (!$('.chat-is-typing').length) {
        $('.chat_messages_list').append(msg);
        setTimeout(function () {
          $('.chat-body').stop().scrollTop($('.chat-body')[0].scrollHeight);
        }, 100);
      }
    } else if ($('.chats_list [data-user_id="' + data.typing.id + '"]').length && !$('.chats_list [data-user_id="' + data.typing.id + '"] .chat-last-mess-hidden').length) {
      $('.chats_list [data-user_id="' + data.typing.id + '"]').append('<span class=chat-last-mess-hidden/>').find('.chat-last-mess-hidden').html($('.chats_list [data-user_id="' + data.typing.id + '"] .chat-last-mess').html());
      $('.chats_list [data-user_id="' + data.typing.id + '"] .chat-last-mess').html(msg);
    }
  } else {
    $('.chat-is-typing').remove();
    if ($('.chat-last-mess-hidden').length) {
      $('.chat-last-mess-hidden').each(function () {
        var text = $(this).html();
        $(this).closest('li').find('.chat-last-mess').html(text);
        $(this).remove();
      });
    }
  }

});
//});