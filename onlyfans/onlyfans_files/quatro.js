$(document).ready(function() {

	/*===== Quarto scripts =====*/
	/*function headerFix() {
		var headerHeight = $('.quatro-main-header').height();
		$('.user_quatro_wrapper').height(headerHeight);
		var avatarPosition = $('.user_avatar_col').offset();
		$('.user_actions').offset(avatarPosition);
	}

	$(window).on('load resize', function() {
		if ($(window).width() > 767) {
			headerFix();
		}
	});*/

	if($(window).width() > 768){
		$('.btn_up').click(function() {
			$('body').animate({'scrollTop': 0}, 1200);
			$('html').animate({'scrollTop': 0}, 1200);
		});

		$(window).scroll(function() {
			if($(window).scrollTop() > 400){
				$('.btn_up').addClass('active');
			} else {
				$('.btn_up').removeClass('active');
			}
		});
	}

	function recUser(){
		new Swiper ('.recommended-slider',{
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

		if($(window).width() < 768){
			$('.subscribe_offers_list').hide();
			$('.quatro-recommended').find('.show-hide').addClass('active').find('.show-word').addClass('active');
			$('.quatro-recommended').find('.show-hide').find('.hide-word').removeClass('active');
		}

		$('.quatro-recommended').on('click', '.show-hide', function() {
			$(this).toggleClass('active').find('.hide-word').toggleClass('active');
			$(this).find('.show-word').toggleClass('active');
			$('.subscribe_offers_list').slideToggle(300);
		});
	}

	recUser();

	$('.quatro-read-info').click(function() {
		$(this).toggleClass('active');
		$('.user_quatro_mobile').find('.user_status').slideToggle();
	});

	$('.quatro-search-form').focusout(function() {
		if( $('.quatro-search-form').find('input').val() != ''){
			$(this).addClass('active');
		} else {
			$(this).removeClass('active');
		}
	});

	if( $(window).width() > 1200 ){
		setTimeout(function() {
			$('.quatro-recommended').removeClass('active');
		}, 800);
	}

});

$(window).on('load resize', function() {
	if($(window).width() < 768){
		var wW = $(window).width() - 13;
		$('.quatro-my-chat .modal-header').width(wW);
	}
});