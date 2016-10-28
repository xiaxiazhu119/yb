(function () {
  'use strict';

  $(function () {

    Number.prototype.toMoney = function (hasDecimal) {
      hasDecimal = typeof hasDecimal === undefined ? true : hasDecimal;

      var v   = this.toFixed(2) + '';
      var arr = v.split('.');
      var i   = arr[0].split('').reverse();
      var l   = i.length;
      var is  = '';

      for (var z = 0; z < l; z++) {
        is += i[z] + ((z + 1) % 3 == 0 && (z + 1) != l ? ',' : '');
      }
      var _i = is.split('').reverse().join('')
      if (hasDecimal)
        return _i + '.' + arr[1];
      return _i;
    };

    var numReg = new RegExp("^[0-9]*$");

    var windowWidth  = $(window).width();
    var windowHeight = $(window).height();
    $('.page').height(windowHeight);

    initSltBtn('.gender-slt');
    /*

     $('.gender-slt').on('click', function () {
     var $this = $(this);
     if ($this.hasClass('active')) return false;

     // console.log(index);

     $this.addClass('active').siblings('.gender-slt').removeClass('active');
     // $this.addClass('active').find('img').prop('src', )
     // $this.siblings('.gender-slt').removeClass('active');


     })
     */
    $('.gender-slt').show().height($('.gender-slt').width()).eq(0).click();

    var ageOpt = {
      min: 18,
      max: 55,
      con: 50
    };

    initClassicAge();

    var yOpt = [
      {
        text: '趸交',
        value: 1
      },
      {
        text: '5年',
        value: 5
      },
      {
        text: '10年',
        value: 10
      },
      {
        text: '20年',
        value: 20
      }
    ];

    initClassicYear();

    initArrowStyle();

    initSltBtn('.btn-age', bonusAgeSltEvent);
    // $('.btn-age:even').click();

    $('.mask,.custom-close').on('click', function () {
      hideModal();
    });

    /*****************************************************************************************
     * 经典试算
     ****************************************************************************************/
    $('#btn-classic-calc').on('click', function () {
      var $this = $(this);

      var amount = $.trim($('#classic-amount').val());
      if (!numReg.test(amount) || amount < 200 || amount > 500) {
        showModal('请输入正确的保险金额');
        return false;
      }

      var g = $('.classic-gender-slt.active').data('gender'),
          a = $('#classic-age').val(),
          o = getSltedOption('#classic-year');

      var r = Number(classicData.fee[g][a][o.index]);

      var feePerYear = Number((amount * r * 10).toFixed(2)),
          totalFee   = feePerYear * o.value;

      var fpys = feePerYear.toMoney(),
          tfs  = totalFee.toMoney();

      console.log('rate: ', r, '\nfee per year: ' + fpys, '\ntotal: ' + tfs);

      /*******************************************************************************
       * 经典 - 试算结果
       ******************************************************************************/
      $('#classic-fee-per-year').html(fpys);
      $('#classic-fee-total').html(tfs);

      /*******************************************************************************
       * 经典 - 账户价值
       ******************************************************************************/
      // var leverage = Math.round(amount * 1000 / feePerYear);

      //calcClassicValue();
      $('.classic-age-slt:even').click();

      scrollPage($this);

    }).click();

    /*****************************************************************************************
     * 经典转换
     ****************************************************************************************/
    $('#btn-classic-convert').on('click', function () {
      var $this = $(this);

      scrollPage($this);
    });

    /*****************************************************************************************
     * 守富试算
     ****************************************************************************************/
    $('#btn-future-calc').on('click', function () {
      var $this = $(this);

      var classicAmount = $.trim($('#classic-amount').val());
      var futureAmount  = $.trim($('#future-amount').val());

      if (!numReg.test(futureAmount)) {
        showModal('请输入正确的转换保额');
        return false;
      }

      if (futureAmount > classicAmount) {
        showModal('转换保额<span class="text-red">不能超过</span>转换时终身寿险的现金价值');
        return false;
      }

      scrollPage($this);
    });


    // console.log(classicData.value);


    /******************************************************************************************************************
     * functions
     *****************************************************************************************************************/

    function initClassicAge() {
      var current = ageOpt.min;
      var $age    = $('#classic-age');
      while (current <= ageOpt.max) {
        $age.append($('<option></option>').text(current + '岁').prop('value', current));
        current++;
      }
      $age.change(function () {
        var age = Number($(this).val());

        var yearOpt = $('#classic-year').find('option');

        if (age > ageOpt.con) {
          var isLast = yearOpt.last().hide().prop('selected');
          if (isLast) {
            yearOpt.first().prop('selected', 'selected');
          }
        } else {
          yearOpt.last().show();
        }
      });
    }

    function initClassicYear() {
      var $year = $('#classic-year');
      for (var i = 0; i < yOpt.length; i++) {
        var item = yOpt[i];
        $year.append($('<option></option>').text(item.text).prop('value', item.value));
      }
      $year.change(function () {
        var $age     = $('#classic-age');
        var age      = $age.val();
        var $ageOpts = $age.find('option');
        var yearOpt  = $year.find('option');
        var isLast   = yearOpt.last().prop('selected');
        var spAges   = $.map($ageOpts, function (n, v) {
          if (Number($(n).prop('value')) > ageOpt.con)
            return n;
        });
        // console.log(spAges);
        if (isLast) {
          $(spAges).hide();
        } else {
          $(spAges).show();
        }
      });
    }

    function initArrowStyle() {
      var $arrow = $('.arrow-container');
      $arrow.css('left', ((windowWidth - $arrow.width()) / 2) + 'px');
    }

    function initSltBtn(elm, ext) {

      $(elm).on('click', function () {
        var $this = $(this);
        if ($this.hasClass('active')) return false;
        $this.addClass('active').siblings(elm).removeClass('active');

        if (ext) {
          ext($this);
        }

      });
    }

    function scrollPage(target) {

      var $btn = $('.btn-page-scroll');

      var index = $btn.index(target);
      index++;

      $('#pages').animate({
        'top': '-' + index + '00%'
      });

    }

    function hideModal() {
      $('.custom-modal-elm').fadeOut(300, function () {
        $('.modal-content-container').html('');
      });
    }

    function showModal(msg) {
      if (msg !== '') {
        $('.modal-content-container').html(msg);
      }
      $('.custom-modal-elm').fadeIn();
    }

    function getSltedOption(elm) {
      var $opt      = $(elm).find('option');
      var $sltedOpt = $(elm).find('option:selected');
      return {
        index: $opt.index($sltedOpt),
        value: Number($sltedOpt.prop('value'))
      };
    }


    /******************************************************************************************************************
     * calc functions
     *****************************************************************************************************************/

    function bonusAgeSltEvent(target) {
      var type = target.data('type');
      if (type === 'c') {
        calcClassicValue();
      }
    }

    function calcClassicValue() {

      var p  = $.trim($('#classic-amount').val()),
          g  = $('.classic-gender-slt.active').data('gender'),
          a  = $('#classic-age').val(),
          o  = getSltedOption('#classic-year'),
          ba = Number($('.classic-age-slt.active').data('v'));    //红利演示所选择的年龄

      var t = o.index + 1;

      g = g.toUpperCase();

      var d = classicData.value[g + t][a];
      // console.log(d);

      var currentAge = a;

      var tt = 0;
      while (currentAge <= ba) {
        var ageDiff = currentAge - a + 1,
            r       = d[ageDiff];
        var v       = Math.round(r * 2000);
        console.log(currentAge, a, ageDiff, r, v);
        tt += v;
        currentAge++;
      }
      console.log(tt);

      $('#classic-value').html(tt.toMoney(false));
    }

  });

})();