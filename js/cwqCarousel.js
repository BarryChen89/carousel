/*
 * 名称：旋转木马切换插件
 * 作者：陈文琦
 * 创建：2017/6/29
 * 更新：2017/6/30
 * 版本：1.0.1
 * 调用：$(selector).cwqCarousel(options);
 * 参数：
    level {Int} : 显示阶层数; 例如显示五个元素，则需要传入3
    items {String} : 元素匹配用选择器
    scale {Int} : 缩放比
    speed {Int} : 切换速度
    autoPlay {Bool} : 是否自动播放
    delay {Int} : 自动播放间隔
    verticalAlign {String} : 垂直对齐方式
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS之类的
        module.exports = factory(require('jquery'));
    } else {
        // 浏览器全局变量(root 即 window)
        root.returnExports = factory(root.jQuery);
    }
}(this, function ($) {
    var defaults = {
        'level':3,
        'items':'li',
        'scale':0.7,
        'speed':300,
        'autoPlay':false,
        'delay':2000,
        'verticalAlign':'middle'
    };

    // 创建对象
    function cwqCarousel(element,options){
        this.settings = $.extend(true, defaults, options || {});
        this.element = element;
    };
 
    cwqCarousel.prototype = {
        init : function(){
            var me = this;
            me.width = me.element.width();
            me.height = me.element.height();
            me.items = me.element.find(me.settings.items);
            me.itemsLen = me.items.length;
            me.itemWidth = $(me.items[0]).width();
            me.itemHeight = $(me.items[0]).height();
            me.itemPositions = [];
            me.curItem = 0;
            // 如元素个数不足以组成所设阶层，则强制重设阶层
            if( me.items < (me.settings.level * 2 - 1) ){
                me.settings.level = Math.ceil( me.items / 2 );
            }

            me.rotateFlag = false;

            me.setPosition();
            me.animateItem(0,true);

            me.bindEvent();
        },
        bindEvent : function(){
            var me = this;
            // 绑定点击切换
            me.items.click(function(){
                if( !me.rotateFlag ){
                    var idx = $(this).index();
                    me.rotateFlag = true;
                    me.animateItem(idx);
                }
            });

            // 是否开启自动播放
            if(me.settings.autoPlay){
                me.autoPlay();
                me.element.hover(function(){
                    window.clearInterval(me.timer);
                },function(){
                    me.autoPlay();
                });
            }

            // 移动端touch监听
            me.element[0].addEventListener("touchstart", function(e){
                var touch = e.targetTouches[0];                
                me.touch = { 
                    startX : touch.pageX, 
                    offsetX : 0
                };

            }, false);

            me.element[0].addEventListener("touchmove", function(e){
                var touch = e.targetTouches[0];
                me.touch.offsetX = (me.touch.startX - touch.pageX);
            }, false);

            me.element[0].addEventListener("touchend", function(e){
                if (me.touch.offsetX < -100) {
            		// 向右滑动
                    me.animateItem( ( me.curItem != 0) ? ( me.curItem - 1 ) : (me.itemsLen - 1));
                }else if(me.touch.offsetX > 100){
            		// 向左滑动
                    me.animateItem( ( (me.curItem + 1 ) % me.itemsLen ) );
                }
            }, false);
        },
        /**
         *  根据所设阶层数，为所有元素初始化各属性
         */
        setPosition : function(){
            var me = this,
                itemsWidth = me.itemWidth,
                itemsHeight = me.itemHeight,
                itemsLen = me.itemsLen,
                scale = me.settings.scale,
                level = me.settings.level,
                firstLeft = (me.width - me.itemWidth)/2,
                gap = firstLeft / level,
                positionArr = me.itemPositions,
                i = 0,
                runtime = level - 1;

            // 初始化
            for(; i < itemsLen; i++){
                positionArr.push({
                    zIndex : ( !i ? level : 0 ),
                    width : ( !i ? me.itemWidth : 0 ),
                    height : ( !i ? me.itemHeight : 0 ),
                    top : ( !i ? me.setVerticalAlign(me.itemHeight) : me.height/2 ),
                    left : ( !i ? firstLeft : me.width/2 ),
                    opacity : ( !i ? 1 : 0 )
                })
            }

            // 右侧元素坐标
            for(i = 1; i <= runtime; i++){
                itemsWidth *= scale;
                itemsHeight *= scale;
                positionArr[i] = {
                    zIndex:--level,
                    width:itemsWidth,
                    height:itemsHeight,
                    opacity:level / me.settings.level ,
                    left:firstLeft + me.itemWidth + (i+1) * gap - itemsWidth,
                    top:me.setVerticalAlign(itemsHeight)
                };
            }

            // 重置
            itemsWidth = me.itemWidth;
            itemsHeight = me.itemHeight;
            level = me.settings.level;  

            // 左侧元素坐标
            for(i = itemsLen-1; i >= (itemsLen - runtime); i--){
                itemsWidth *= scale;
                itemsHeight *= scale;
                positionArr[i] = {
                    zIndex:--level,
                    width:itemsWidth,
                    height:itemsHeight,
                    opacity:level / me.settings.level ,
                    left:firstLeft - (itemsLen-i+1) * gap,
                    top:me.setVerticalAlign(itemsHeight)
                };
            }
        },
        /*
         * 根据选中项index，重置所有元素坐标
         */
        animateItem:function(curIdx,def){
            var me = this,
                curArr = me.items,
                tempArr = [],
                positionArr = me.itemPositions,
                speed = me.settings.speed,
                i = 0;

            me.curItem = curIdx;
            // 重新排序数组
            for(;i<curArr.length;i++){
                tempArr[
                   ( i - curIdx >= 0 ) 
                        ? ( i - curIdx )
                        : ( i - curIdx+curArr.length )
                ] = curArr[i];
            }

            if(def){
                for(i = 0; i < tempArr.length; i++){
                    $(tempArr[i]).css(positionArr[i]);
                }
            }else{
                for(i = 0; i < tempArr.length; i++){
                    $(tempArr[i]).animate(positionArr[i],
                        speed,function(){
                            me.rotateFlag = false;
                        });
                }
            }               
        },
        autoPlay : function(){
            var me = this;
                me.timer = window.setInterval(function(){
                    me.animateItem( ( (me.curItem + 1 ) % me.itemsLen ) );
                },me.settings.delay);
        },
        cancelAutoPlay : function(){
            window.clearInterval(this.timer);
        },
        setVerticalAlign:function(height){
            var me = this;
            var verticalType = me.settings.verticalAlign,
                top = 0;
            if(verticalType === "middle"){
                top = (me.height - height)/2;
            }else if(verticalType === "top"){
                top = 0;
            }else if(verticalType === "bottom"){
                top = me.height - height;
            }else{
                top = (me.height-height)/2;
            }
            return top;
        }
    };

    // 暴露公共方法
    //return cwqCarousel;
    $.fn.cwqCarousel = function(options){
        return this.each(function(){
            var instance = $(this).data('cwqCarousel');
            if(!instance){
                instance = new cwqCarousel($(this),options);
                instance.init();
                $(this).data('cwqCarousel',instance);
            }
        })
    };
}));