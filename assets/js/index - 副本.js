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

    //上一年度总退保金额
    var annuity = 0;
    var initialAnnuity = 0;

    /******************************************************************************************************************
     *
     *
     * region 经典型
     *
     *
     ******************************************************************************************************************/

    var feePerYear = 0,   //年交保费
        totalFee   = 0,   //共计
        bonus      = 0;   //红利

    var classicAgeRange = {
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

      var r = Number(GP[g][a][o.index]);

      feePerYear = Number((amount * r * 10).toFixed(2));
      totalFee   = feePerYear * o.value;

      var fpys = feePerYear.toMoney(),
          tfs  = totalFee.toMoney();

      //console.log('amount:',amount + '\nrate: ', r, '\nfee per year: ' + fpys, '\ntotal: ' + tfs);

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

    });

    /*****************************************************************************************
     * 经典转换
     ****************************************************************************************/
    $('#btn-classic-convert').on('click', function () {
      var $this = $(this);

      var classicAge = Number($('#classic-age').val());
      overRange      = (convertAgeRange.min - classicAge) < convertAgeOffset;
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

      initFutureAge();

      scrollPage($this, checkConvertAge);
    });

    /******************************************************************************************************************
     *
     *
     * end region 经典型
     *
     *
     ******************************************************************************************************************/


    /******************************************************************************************************************
     *
     *
     * region 守富未来
     *
     *
     ******************************************************************************************************************/


    /*****************************************************************************************
     * 守富试算
     ****************************************************************************************/
    $('#btn-future-calc').on('click', function () {
      var $this = $(this);

      var classicAmount = $.trim($('#classic-amount').val());
      var convertAmount = $.trim($('#convert-amount').val());

      if (!numReg.test(convertAmount)) {
        showModal('请输入正确的转换保额');
        return false;
      }

      if (convertAmount > classicAmount) {
        showModal('转换保额<span class="text-red">不能超过</span>转换时终身寿险的现金价值');
        return false;
      }

      var age = Number($('#future-age').val()),
          a   = $('#classic-age').val(),
          g   = $('.future-gender-slt.active').data('gender'),
          o   = getSltedOption('#classic-year');


      classicAmount = Number(classicAmount) * 10000;
      convertAmount = Number(convertAmount) * 10000;


      //守富未来初算年金金额(元) = 上一年度总退保金 / PA30 GP系数 * ( (保险金额 - 转换后剩余金额) / 保险金额) * 1000
      //上一年度总退保金 = 上一年度（相对于转换年龄，即转换年龄为60，则上一年度为59）累计增值红利 / 1000 * 转换年龄 RBCSV_factor 系数 + 上一年度退保金
      //上一年度退保金 = CSV系数 * 保险金额 / 1000
      // *上一年度指转换年龄-1

      //上一年度退保金
      var totalSurrender = calcTotalSurrender(a, age, classicAmount, g, o);
      console.log('上一年度总退保金:', totalSurrender);

      var pa30gpRate = PA30_GP[g][age];

      //界面设计为选择转换的金额，因此公式直接为转换金额/总金额
      // var rst = totalSurrender / pa30gpRate * ((amount - 500000) / amount) * 1000;
      initialAnnuity = totalSurrender / pa30gpRate * (convertAmount / classicAmount) * 1000;
      console.log('守富未来初算年金金额(元): ', initialAnnuity);

      $('#future-amount').html(initialAnnuity.toMoney()).data('amount', initialAnnuity);

      annuity = Math.round(initialAnnuity) - 1;


      /*

      //上一年度累计增值红利
      var valueAddedBonus  = calcValueBase(convertAmount, g, a, o, age - 1);
      //总退保金系数
      var rbscv_factorRate = RBCSV_factor[g][age];
      //console.log('上一年度累积增值红利:', valueAddedBonus, '\n总退保金系数(RBCSV_factor Rate):' + rbscv_factorRate);

      //上一年度退保金（现金价值）率
      var surrenderValueRate = CSV[g + (o.index + 1)][a][age - a];
      //上一年度退保金（现金价值）
      var surrenderValue     = Number(classicAmount) * 10 * surrenderValueRate;
      //console.log('退保金（现金价值）率:', surrenderValueRate + '\n退保金（现金价值）:', surrenderValue);

      var futureAmount = Math.round((valueAddedBonus / 1000 * rbscv_factorRate + surrenderValue ) / PA30_GP[g][age] * (convertAmount / classicAmount) * 1000);
      //console.log('守富未来初算年金金额(元):', futureAmount);

      */

      //return false;

      if (overRange) {
        $('.future-age-slt:odd').click();
        $('.future-age-slt:even').off('click').addClass('disabled');
      } else {
        $('.future-age-slt:even').click();
      }

      scrollPage($this);
    });

    /******************************************************************************************************************
     *
     *
     * end region 守富未来
     *
     *
     ******************************************************************************************************************/


    /******************************************************************************************************************
     *
     *
     * region functions
     *
     *
     *****************************************************************************************************************/

    /*************************************************************************************************
     * 初始化 经典型 年龄控件
     ************************************************************************************************/
    function initClassicAge() {
      var current = classicAgeRange.min;
      var $age    = $('#classic-age');
      while (current <= classicAgeRange.max) {
        $age.append($('<option></option>').text(current + '岁').prop('value', current));
        current++;
      }
      $age.change(function () {
        var age = Number($(this).val());

        var yearOpt = $('#classic-year').find('option');

        if (age > classicAgeRange.con) {
          var isLast = yearOpt.last().hide().prop('selected');
          if (isLast) {
            yearOpt.first().prop('selected', 'selected');
          }
        } else {
          yearOpt.last().show();
        }
      });
    }

    /*************************************************************************************************
     * 初始化 经典型 交费年限控件
     ************************************************************************************************/
    function initClassicYear() {
      var $year = $('#classic-year');
      for (var i = 0; i < yOpt.length; i++) {
        var item = yOpt[i];
        $year.append($('<option></option>').text(item.text).prop('value', item.value));
      }
      $year.change(function () {
        var $age              = $('#classic-age');
        var age               = $age.val();
        var $classicAgeRanges = $age.find('option');
        var yearOpt           = $year.find('option');
        var isLast            = yearOpt.last().prop('selected');
        var spAges            = $.map($classicAgeRanges, function (n, v) {
          if (Number($(n).prop('value')) > classicAgeRange.con)
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

      /*
       $('#pages').animate({
       'top': '-' + index + '00%'
       }, 500, function () {
       if (callback) {
       callback();
       }
       });
       */

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


    /******************************************************************************************************************
     * calc functions
     *****************************************************************************************************************/

    /*************************************************************************************************
     * 红利演示中 年龄选择事件
     ************************************************************************************************/
    function bonusAgeSltEvent(target) {
      var type = target.data('type');
      if (type === 'c') {
        calcClassicValue();
      } else {
        calcCashBonus();
      }
    }

    /*************************************************************************************************
     * 计算经典型账户价值
     ************************************************************************************************/
    function calcClassicValue() {

      var p  = $.trim($('#classic-amount').val()),
          g  = $('.classic-gender-slt.active').data('gender'),
          a  = $('#classic-age').val(),
          o  = getSltedOption('#classic-year'),
          ba = Number($('.classic-age-slt.active').data('v'));    //红利演示所选择的年龄

      bonus = calcValueBase(p, g, a, o, ba);

      var tt = bonus + Number(p) * 10000;

      $('#classic-value').html(tt.toMoney(false));
    }

    function calcValueBase(amount, gender, age, yearObj, bonusAge) {

      //gender = gender.toUpperCase();

      var t   = yearObj.index + 1,
          d   = DivM[gender + t][age],
          ca  = age,
          rst = 0;

      while (ca <= bonusAge) {
        var ad = ca - age + 1,
            r  = d[ad];

        // var v  = Math.round(r * amount * 10);
        var v = r * amount * 10;

        //console.log(ca, age, ad, r, v);

        rst += v;
        ca++;
      }

      rst = Math.round(rst);

      //console.log('calc value base rst:', rst);
      return rst;
    }


    //获取年度退保金
    function calcTermSurrender(startAge, endAge, amount, gender, type) {
      var term      = endAge - startAge;
      var csvRate   = CSV[gender + type][startAge][term];
      var surrender = csvRate * amount / 1000;
      console.log('年度: ', term, ' 退保金：', surrender);
      return surrender;
    }

    function calcTotalSurrender(startAge, endAge, amount, gender, o) {

      //上一年度（相对于转换年龄，即转换年龄为60，则上一年度为59）累计增值红利
      var bonus = calcValueBase(amount / 10000, gender, startAge, o, endAge - 1);
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

      var futureAge = Number($('.future-age-slt.active').data('v')),
          gender    = $('.future-gender-slt.active').data('gender'),
          age       = Number($('#future-age').val()),
          ad        = futureAge - age;

      var c = age;

      var lastYearCashBonus = 0;

      while (c <= futureAge) {
        var diff = ad - (futureAge - c);

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

    function initFutureAge() {
      var current = convertAgeStart;
      while (current <= convertAgeRange.max) {
        $('#future-age').append($('<option></option>').text(current + '岁').prop('value', current));
        current++;
      }
    }


    /*************************************************************************************************
     * 初始化箭头样式
     ************************************************************************************************/
    function initArrowStyle() {
      var $arrow = $('.arrow-container');
      $arrow.css('left', ((windowWidth - $arrow.width()) / 2) + 'px');
    }

    /******************************************************************************************************************
     *
     *
     * end region functions
     *
     *
     *****************************************************************************************************************/

  });

})();