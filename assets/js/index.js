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
      var _i = is.split('').reverse().join('');
      if (hasDecimal)
        return _i + '.' + arr[1];
      return _i;
    };

    var windowWidth  = $(window).width();
    var windowHeight = $(window).height();
    $('.page').height(windowHeight);
    $('body').height(windowHeight * 4);

    var numReg = new RegExp("^[0-9]*$");

    initSltBtn('.gender-slt');
    var $genderSlt = $('.gender-slt');
    $genderSlt.show().height($genderSlt.width());
    $('.gender-slt:even').click();

    var convertAgeOffset = 10;

    var convertAgeRange = {
      min: 60,
      max: 70
    };

    var convertAgeStart = convertAgeRange.min;

    var _sumCashBonusRate = 1.03;

    var overRange = false;

    //年金金额
    var annuity        = 0;
    //初算年金金额
    var initialAnnuity = 0;

    var ageRange = {
      min: 18,
      max: 55,
      con: 50
    };

    initClassicAge();

    var classicBonus = 0;

    var paymentType = [
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

    initPaymentType();

    initArrowStyle();

    initSltBtn('.btn-age', bonusAgeSltEvent);


    $('.mask,.custom-close').on('click', function () {
      hideModal();
    });

    /*****************************************************************************************
     * 经典试算
     ****************************************************************************************/
    $('#btn-classic-calc').on('click', function () {
      var $this = $(this);

      var classicCalcRst = calcClassic();
      if (classicCalcRst) {
        $('.classic-age-slt:even').click();
        scrollPage($this);
      }

    });

    /*****************************************************************************************
     * 经典转换
     ****************************************************************************************/
    $('#btn-classic-convert').on('click', function () {
      var $this = $(this);

      var age   = Number($('#age').val());
      overRange = (convertAgeRange.min - age) < convertAgeOffset;
      if (overRange) {
        convertAgeStart = classicAge + convertAgeOffset;
      }

      var checkConvertAge = function () {
        if (overRange) {
          var msg = '';
          msg += '<p>• 被保险人转换年金保险时必须在主保单生效<span class="text-red">' + convertAgeOffset + '年后</span></p>';
          msg += '<p>• 年龄选择范围：<span class="text-red">' + convertAgeRange.min + '~' + convertAgeRange.max + '（周岁）</span></p>';
          showModal(msg);
        }
      };

      initConvertAge();

      scrollPage($this, checkConvertAge);
    });

    /*****************************************************************************************
     * 守富试算
     ****************************************************************************************/
    $('#btn-future-calc').on('click', function () {
      var $this = $(this);

      var calcFutureRst = calcFuture();
      if (calcFutureRst) {
        scrollPage($this);
      }

    });


    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //


    function calcClassic() {
      var amount = $.trim($('#amount').val());
      if (!numReg.test(amount) || amount < 200 || amount > 500) {
        showModal('请输入正确的保险金额');
        return false;
      }

      var gender      = $('.classic-gender-slt.active').data('gender'),
          age         = $('#age').val(),
          paymentType = getSltedOption('#payment-type');

      var amountPerYearRate = Number(GP[gender][age][paymentType.index]);

      var amountPerYear = Number((amount * amountPerYearRate * 10).toFixed(2));
      var totalAmount   = amountPerYear * paymentType.value;

      $('#amount-per-year').html(amountPerYear.toMoney()).data('value', amountPerYear);
      $('#amount-total').html(totalAmount.toMoney()).data('value', totalAmount);

      return true;

    }

    /*************************************************************************************************
     * 计算传世经典 - 累计（中档）增值红利
     ************************************************************************************************/
    function calcClassicBonus() {

      var amount         = $.trim($('#amount').val()),
          gender         = $('.classic-gender-slt.active').data('gender'),
          age            = $('#age').val(),
          paymentType    = getSltedOption('#payment-type'),
          destinationAge = Number($('.classic-age-slt.active').data('v'));    //红利演示所选择的年龄

      classicBonus = calcClassicBonusBase(amount, gender, age, paymentType, destinationAge);

      var total = classicBonus + Number(amount) * 10000;

      $('#account-value').html(total.toMoney(false));
    }

    /*
     * amount（单位：万元）
     */
    function calcClassicBonusBase(amount, gender, age, paymentType, destinationAge) {

      var t   = paymentType.index + 1,
          d   = DivM[gender + t][age],
          ca  = age,
          rst = 0;

      while (ca <= destinationAge) {
        var ad = ca - age + 1,
            r  = d[ad];

        rst += r * amount * 10;
        ca++;
      }

      rst = Math.round(rst);
      return rst;
    }//获取年度退保金

    function calcFuture() {

      var amount        = $.trim($('#amount').val());
      var convertAmount = $.trim($('#convert-amount').val());

      if (!numReg.test(convertAmount)) {
        showModal('请输入正确的转换保额');
        return false;
      }

      if (convertAmount > amount) {
        showModal('转换保额<span class="text-red">不能超过</span>转换时终身寿险的现金价值');
        return false;
      }

      var convertAge  = Number($('#convert-age').val()),
          age         = $('#age').val(),
          gender      = $('.future-gender-slt.active').data('gender'),
          paymentType = getSltedOption('#payment-type');


      amount        = Number(amount) * 10000;
      convertAmount = Number(convertAmount) * 10000;


      //守富未来初算年金金额(元) = 上一年度总退保金 / PA30 GP系数 * ( (保险金额 - 转换后剩余金额) / 保险金额) * 1000
      //上一年度总退保金 = 上一年度（相对于转换年龄，即转换年龄为60，则上一年度为59）累计增值红利 / 1000 * 转换年龄 RBCSV_factor 系数 + 上一年度退保金
      //上一年度退保金 = CSV系数 * 保险金额 / 1000
      // *上一年度指转换年龄-1

      //上一年度退保金
      var totalSurrender = calcTotalSurrender(age, convertAge, amount, gender, paymentType);
      console.log('上一年度总退保金:', totalSurrender);

      var pa30gpRate = PA30_GP[gender][convertAge];

      //界面设计为选择转换的金额，因此公式直接为转换金额/总金额
      // var rst = totalSurrender / pa30gpRate * ((amount - 500000) / amount) * 1000;
      initialAnnuity = totalSurrender / pa30gpRate * (convertAmount / amount) * 1000;
      initialAnnuity = Math.round(initialAnnuity);
      console.log('守富未来初算年金金额(元): ', initialAnnuity);

      $('#initial-annuity-amount').html(initialAnnuity.toMoney()).data('amount', initialAnnuity);

      // annuity = Math.round(initialAnnuity) - 1;
      annuity = initialAnnuity - 1;

      if (overRange) {
        $('.future-age-slt:odd').click();
        $('.future-age-slt:even').off('click').addClass('disabled');
      } else {
        $('.future-age-slt:even').click();
      }
      return true;
    }

    function calcTermSurrender(startAge, endAge, amount, gender, type) {
      var term      = endAge - startAge;
      var csvRate   = CSV[gender + type][startAge][term];
      var surrender = csvRate * amount / 1000;
      console.log('年度: ', term, ' 退保金：', surrender);
      return surrender;
    }

    function calcTotalSurrender(startAge, endAge, amount, gender, o) {

      //上一年度（相对于转换年龄，即转换年龄为60，则上一年度为59）累计增值红利
      var bonus = calcClassicBonusBase(amount / 10000, gender, startAge, o, endAge - 1);
      console.log('上一年度累计增值红利:', bonus);
      var rbcsvRate = RBCSV_factor[gender][endAge];

      var prevSurrender = calcTermSurrender(startAge, endAge, amount, gender, o.index + 1);

      var _ts = bonus / 1000 * rbcsvRate + prevSurrender;

      return _ts;
    }

    /*************************************************************************************************
     * 计算守富未来累计现金红利
     ************************************************************************************************/
    function calcCashBonus() {

      //累积现金红利 = 上一年度累积现金红利 * 1.03 + 当年度现金红利
      //当年度现金红利 = (初算年金 - 1) / 1000 * PA30_DivM系数

      var destinationAge = Number($('.future-age-slt.active').data('v')),
          gender         = $('.future-gender-slt.active').data('gender'),
          age            = Number($('#convert-age').val()),
          ageDiff        = destinationAge - age;

      var c = age;

      var lastYearCashBonus = 0;

      while (c <= destinationAge) {
        var diff = ageDiff - (destinationAge - c);

        var currentYearCashBonus = calcCurrentYearCashBonus(gender, age, diff + 1);
        if (diff === 0) {
          lastYearCashBonus = currentYearCashBonus;
        } else {
          lastYearCashBonus = lastYearCashBonus * _sumCashBonusRate + currentYearCashBonus;
        }

        //lastYearCashBonus = Math.round(lastYearCashBonus);

        console.log('age:', c, ' currentYearCashBonus:', currentYearCashBonus, ' lastYearCashBonus:', lastYearCashBonus);
        c++;
      }

      lastYearCashBonus = Math.round(lastYearCashBonus);

      // console.log('lastYearCashBonus:', lastYearCashBonus);

      $('#cash-bonus').html(lastYearCashBonus.toMoney());

    }

    /*************************************************************************************************
     * 计算当年度现金红利系数
     ************************************************************************************************/
    function calcCurrentYearCashBonus(gender, age, year) {

      var currentYearCashBonusRate = PA30_DivM[gender][age][year];
      //console.log('当年度现金红利系数:', currentYearCashBonusRate);

      //var futureAmount = Number($('#future-amount').data('amount')) - 1;

      // var currentYearCashBonus     = Math.round(futureAmount / 1000 * currentYearCashBonusRate);
      var currentYearCashBonus = annuity / 1000 * currentYearCashBonusRate;

      //console.log('当年度现金红利:', currentYearCashBonus);

      return currentYearCashBonus;
    }

    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //

    /*************************************************************************************************
     * 红利演示中 年龄选择事件
     ************************************************************************************************/
    function bonusAgeSltEvent(target) {
      var type = target.data('type');
      if (type === 'c') {
        calcClassicBonus();
      } else {
        calcCashBonus();
      }
    }

    function initConvertAge() {
      var current = convertAgeStart;
      while (current <= convertAgeRange.max) {
        $('#convert-age').append($('<option></option>').text(current + '岁').prop('value', current));
        current++;
      }
    }

    /*************************************************************************************************
     * 初始化 传世经典 年龄控件
     ************************************************************************************************/
    function initClassicAge() {
      var current = ageRange.min;
      var $age    = $('#age');
      while (current <= ageRange.max) {
        $age.append($('<option></option>').text(current + '岁').prop('value', current));
        current++;
      }
      $age.change(function () {
        var age = Number($(this).val());

        var $typeOpts = $('#payment-type').find('option');

        if (age > ageRange.con) {
          var isLast = $typeOpts.last().hide().prop('selected');
          if (isLast) {
            $typeOpts.first().prop('selected', 'selected');
          }
        } else {
          $typeOpts.last().show();
        }
      });
    }


    /*************************************************************************************************
     * 初始化 传世经典 交费年限控件
     ************************************************************************************************/
    function initPaymentType() {
      var $type = $('#payment-type');
      for (var i = 0; i < paymentType.length; i++) {
        var item = paymentType[i];
        $type.append($('<option></option>').text(item.text).prop('value', item.value));
      }
      $type.change(function () {
        var $age       = $('#age');
        var age        = $age.val();
        var $ageRanges = $age.find('option');
        var isLast     = $(this).find('option:last:selected').prop('selected');
        var spAges     = $.map($ageRanges, function (n, v) {
          if (Number($(n).prop('value')) > ageRange.con)
            return n;
        });
        console.log(isLast);
        if (isLast) {
          $(spAges).hide();
        } else {
          $(spAges).show();
        }
      });
    }

    /*************************************************************************************************
     * 初始 红利演示中 选择按钮 事件
     ************************************************************************************************/
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

    /*************************************************************************************************
     * 滚动页面
     ************************************************************************************************/
    function scrollPage(target, callback) {

      var $btn = $('.btn-page-scroll');

      var index = $btn.index(target);
      index++;

      $("html, body").animate({scrollTop: windowHeight * index}, 500);

    }

    /*************************************************************************************************
     * 隐藏模态框
     ************************************************************************************************/
    function hideModal() {
      $('.custom-modal-elm').fadeOut(300, function () {
        $('.modal-content-container').html('');
      });
    }

    /*************************************************************************************************
     * 显示模态框
     ************************************************************************************************/
    function showModal(msg) {
      if (msg !== '') {
        $('.modal-content-container').html(msg);
      }
      $('.custom-modal-elm').fadeIn();
    }

    /*************************************************************************************************
     * 获取下拉列表选中项
     * 项索引及值
     ************************************************************************************************/
    function getSltedOption(elm) {
      var $opt      = $(elm).find('option');
      var $sltedOpt = $(elm).find('option:selected');
      return {
        index: $opt.index($sltedOpt),
        value: Number($sltedOpt.prop('value'))
      };
    }

    /*************************************************************************************************
     * 初始化箭头样式
     ************************************************************************************************/
    function initArrowStyle() {
      var $arrow = $('.arrow-container');
      $arrow.css('left', ((windowWidth - $arrow.width()) / 2) + 'px');
    }


  });


})();