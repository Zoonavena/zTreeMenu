(function (window, document, undefined) {

  var factory = function ($) {
    "use strict";

    function guid() {
      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      }

      return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }

    /* Number */
    var Beautifier = function (element, options) {
      this.$element = element
      this.treeId = null
      this.treeMenuContent = null
      this.Defaults = {
        theme: 'ztree',
        style: {},
        selectCallback: function () {
        },
        console: 0,
        setting: {
          view: {
            dblClickExpand: false
          },
          data: {
            simpleData: {
              enable: true
            }
          }
        }
      }
      this.options = $.extend(true, {}, this.Defaults, options)
      return this.init()
    };
    Beautifier.prototype = {
      // 调试模式
      /**
       *
       * @param msg
       * @returns {null}
       */
      log: function (msg) {
        this.options.console ? console.log(msg) : null
        return this
      },
      // 树配置
      setting: function () {
        var that = this
        return $.extend(true, {}, this.options.setting, {
          callback: {
            /**
             *  拦截节点被点击的事件回调函数
             * @param e
             * @param treeId
             * @param treeNode
             */
            onClick: function (e, treeId, treeNode) {
              that.onClick(e, treeId, treeNode)
              if (that.options.setting && that.options.setting.callback && that.options.setting.callback.onClick && typeof that.options.setting.callback.onClick == 'function') {
                that.options.setting.callback.onClick(that, e, treeId, treeNode)
              }
            },
            /**
             *  拦截异步加载正常结束的事件回调函数 获取数据进行缓存
             * @param event
             * @param treeId
             * @param treeNode
             * @param msg
             */
            onAsyncSuccess: function (event, treeId, treeNode, msg) {
              that.options.data = $.fn.zTree.getZTreeObj(treeId).getNodes()
              if (that.options.setting && that.options.setting.callback && that.options.setting.callback.onAsyncSuccess && typeof that.options.setting.callback.onAsyncSuccess == 'function') {
                that.options.setting.callback.onAsyncSuccess(event, treeId, treeNode, msg)
              }
            }
          }
        })
      },
      /**
       * 节点选中
       * @param e
       * @param treeId
       * @param treeNode
       */
      onClick: function (e, treeId, treeNode) {
        var that = this
        var zTree = $.fn.zTree.getZTreeObj(e.currentTarget.id)
        var nodes = zTree.getSelectedNodes()
        var v = '';
        nodes.sort(function compare(a, b) {
          return a.id - b.id;
        });
        for (var i = 0, l = nodes.length; i < l; i++) {
          v += nodes[i].name + ","
        }
        if (v.length > 0) v = v.substring(0, v.length - 1)
        that.$element.val(v)
          .data({'data': nodes})
          .trigger('change')
        return this
      },
      // 绑定搜索
      onSearch: function () {
        var that = this
        that.log('onSearch')
          .treeRendering()
          .$element.removeData('data iSSearch')
        var $inputVal = that.$element.val()
        if ($inputVal.length > 0) {
          var zTree = $.fn.zTree.getZTreeObj('tree-list-' + that.treeId)
          var nodeList = zTree.getNodesByParamFuzzy("name", $inputVal);
          // 将找到的nodelist节点更新至Ztree内
          if (nodeList.length > 0) {
            that.treeRendering(nodeList)
            that.$element.data('iSSearch', true)
          } else {
            $("#tree-list-" + that.treeId).html('<li class="no-results">没有匹配结果 "<span>' + $inputVal + '</span>"</li>')
          }
        }
        return this
      },
      // 选中当前值
      selectNode: function () {
        var that = this
        var $inputData = that.data() || [] //$el.data('data')
        var zTree = $.fn.zTree.getZTreeObj('tree-list-' + that.treeId);
        zTree.cancelSelectedNode() // 取消当前所有被选中节点的选中状态
        $.each($inputData || [], function (i, v) {
          var node = zTree.getNodeByParam("id", v.id);
          zTree.selectNode(node, true); // 指定选中ID的节点
          zTree.expandNode(node, true, false); // 指定选中ID节点展开
          that.$element.val(zTree.getSelectedNodes()[i].name).data('data', [zTree.getSelectedNodes()[i]]) // 显示配置节点name
        })
        return this
      },
      // 表单域值改变时
      onChange: function () {
        var that = this
        that.log('onChange')
        if (that.$element.data('iSSearch')) {
          that.log('搜索触发 onChange')
          return this
        }
        var $inputData = that.data()
        if ($inputData === null && !that.$element.data('iSSearch')) {
          that.log('清空')
            .$element.removeData('data')
            .val(null)
            .trigger('zTreeMenu:selecting')
            .data('zTreeMenu')
            .selectNode.call(this)
        } else if ($inputData === undefined || ($inputData && $inputData[0].level >= 0)) {
          that.log('用户选择')
            .callback.call(this)
        } else if (!that.$element.data('iSSearch') && $inputData && !$inputData[0].level) {
          that.log('配置')
            .selectNode.call(this)
        }
        return this
      },
      // GET 当前值
      data: function () {
        return this.$element.data('data')
      },
      // 用户选择回调
      callback: function () {
        this.$element.trigger('zTreeMenu:select')
        this.options.selectCallback.call(this, this.$element.data('data'))
      },
      // 打开菜单
      open: function () {
        var that = this
        var cityOffset = that.$element.offset();
        var elOuterHeight = that.$element.outerHeight()

        var positioning = function (offset) {
          offset = offset || cityOffset
          that.treeMenuContent.css({
            left: offset.left + "px",
            top: offset.top + elOuterHeight + "px"
          })
        }

        if (that.treeMenuContent.is(':visible')) return this
        positioning(cityOffset)
        that.treeMenuContent.slideDown('fast', function () {
          $(document).on("mousedown", that.closeFn = function () {
            if ($(event.target).parents('.treeMenuContent').length < 1 && !($(event.target).data('treeId') && $(event.target).data('treeId') === that.treeId)) {
              that.close.call(that)
            }
          });
          that.scrollbar.call(that)
          that.$element.trigger('zTreeMenu:open')
        });
        that.positioningSetInterval = window.setInterval(function () {
          var tempCityOffset = that.$element.offset();
          if (cityOffset.left !== tempCityOffset.left || cityOffset.top !== tempCityOffset.top) {
            cityOffset = tempCityOffset
            positioning(tempCityOffset)
          }
        }, 20)
        return this
      },
      // 关闭菜单
      close: function () {
        var that = this
        that.log('close')
          .treeMenuContent.fadeOut('fast', function () {
          if (that.$element.data('iSSearch')) {
            that.$element.removeData('iSSearch')
            that.treeRendering()
              .selectNode()
          }
          that.$element.trigger('zTreeMenu:close')
          $(document).off("mousedown", that.closeFn)
          window.clearInterval(that.positioningSetInterval)
        })
        return this
      },
      // 树更新
      update: function () {
        var that = this
        if (that.options.setting && that.options.setting.async && that.options.setting.async.enable) {
          this.options.data = null
        }
        that.treeRendering()
      },
      // 销毁菜单
      destroy: function () {
        var that = this
        that.$element.off('click', that.clickTempFn)
          .off('change', that.onChangeTempFn)
          .off('input propertychange', that.onSearchTempFn)
          .val(null)
          .removeData('zTreeMenu')
        that.treeMenuContent.remove()
        return this
      },
      // 渲染树DOM
      treeRendering: function (treeData) {
        if (this.options.data || treeData) {
          $.fn.zTree.init($("#tree-list-" + this.treeId), this.setting(), treeData || this.options.data)
        } else {
          $.fn.zTree.init($("#tree-list-" + this.treeId), this.setting())
        }
        return this
      },
      // 获取树对象
      getTreeObj: function () {
        return $.fn.zTree.getZTreeObj('tree-list-' + this.treeId)
      },
      // 树滚动
      scrollbar: function () {
        var that = this
        //  在动画结束后触发滚动 延时200ms
        if ($.fn.perfectScrollbar == null) {
          console.warn('未引用滚动扩展 perfectScrollbar ')
          return this
        }
        window.setTimeout(function(){that.treeMenuContent.perfectScrollbar().perfectScrollbar('update')}, 200)
        return this
      },
      // 树初始化
      init: function () {
        var that = this
        var $zTreeMenu = that.$element.data('zTreeMenu')
        // 当前菜单是否初始化
        if (!$zTreeMenu) {
          // 添加GUID
          that.treeId = 'zTreeMenu-' + guid()
          // 创建树菜单DOM
          $('body').append(that.treeMenuContent = $('<div class="treeMenuContent">\n' +
            '<ul id="tree-list-' + that.treeId + '" class="' + that.options.theme + '"></ul>\n' +
            '</div>')
            .css(that.options.style)
            .data('treeId', that.treeId)
            .attr('id', 'tree-menu-content-' + that.treeId)
            .on('click', function () {
              that.scrollbar.call(that)
            }))
          // 初始化树 & 绑定菜单事件
          that.treeRendering()
            .$element.data('treeId', that.treeId)
            .on('click', that.clickTempFn = function () {
              that.open.call(that)
            })
            .on('change', that.onChangeTempFn = function () {
              that.onChange.call(that)
            })
            .on('input propertychange', that.onSearchTempFn = function () {
              that.onSearch.call(that)
            })
            .data('zTreeMenu', that)
        } else {
          $zTreeMenu.destroy()
            .init()
            .treeRendering()
        }
        return this
      }
    };
    // 向$.fn 添加属性
    if ($.fn.zTreeMenu == null) {
      // All methods that should return the element
      var thisMethods = ['open', 'close', 'destroy'];
      $.fn.zTreeMenu = function (options) {
        options = options || {};

        if (typeof options === 'object') {
          this.each(function () {
            var instanceOptions = $.extend(true, {}, options);

            var instance = new Beautifier($(this), instanceOptions);
          });

          return this;
        } else if (typeof options === 'string') {
          var ret;
          var args = Array.prototype.slice.call(arguments, 1);

          this.each(function () {
            var instance = $(this).data('zTreeMenu');

            if (instance == null && window.console && console.error) {
              console.error(
                'The zTreeMenu(\'' + options + '\') method was called on an ' +
                'element that is not using zTreeMenu.'
              );
            }

            ret = instance[options].apply(instance, args);
          });

          // Check if we should be returning `this`
          if ($.inArray(options, thisMethods) > -1) {
            return this;
          }

          return ret;
        } else {
          throw new Error('Invalid arguments for zTreeMenu: ' + options);
        }
      }
    }

    // data配置方法
    var zTreeMenuDataApi = function ($el) {

      var dataList = ['setting', 'source', 'console', 'ajaxUrl', 'theme', 'style'];

      // 获取data配置对象
      var getData = function ($el, dL) {
        var list = {}, dn, dv;
        for (var i = 0; i < dL.length; i++) {
          dn = dL[i];
          dv = $el.data(dn);
          if (dv) {
            list[dn === 'source' ? dn = 'data' : dn] = dv;
          }
        }
        return list
      };

      // 处理data配置数据类型
      var dealData = function (oldList) {

        // 工具方法-转换成对象类型
        var toObject = function (dn, dv) {
          try {
            return JSON.parse(dv.replace(/\'/g, '"'));
          }
          catch (err) {
            throw new Error("请配置正确的data-" + dn + "数据类型！")
          }
        };

        // 更新配置对象

        if (oldList.setting) {
          oldList.setting = toObject('setting', oldList.setting);
        }
        if (oldList.data) {
          oldList.data = toObject('data', oldList.data);
        }
        if (oldList.style) {
          oldList.style = toObject('style', oldList.style);
        }
        if (typeof oldList.theme !== 'string') delete oldList.theme;
        if (typeof oldList.console !== 'number') delete oldList.console;
        return oldList;
      };

      // 处理页面上的data-init树初始化对象

      var options = dealData(getData($el, dataList));

      // 调用树初始化方法
      $el.zTreeMenu($.extend(true, {}, options.ajaxUrl!==undefined ? {
        setting:{async: {
          enable: true,
          url: options.ajaxUrl
        }
        }}:{}, options));

      $el.data('init.ext.zTreeMenu.data-api', true);
    };

    //data初始化方法监听、执行
    $(document)
      .on('init.ext.zTreeMenu.data-api', '[data-init="zTreeMenu"]', function (e) {
        var $this = $(this);
        if ($this.data('init.ext.zTreeMenu.data-api')) return;
        zTreeMenuDataApi($this);
      })
      //AJAX停止事件
      .ajaxStop(function () {
        $('[data-init="zTreeMenu"]').trigger("init.ext.zTreeMenu.data-api");
      });
    //页面初始化
    $(function () {
      $('[data-init="zTreeMenu"]').trigger("init.ext.zTreeMenu.data-api");
    });

}; // /factory

// Define as an AMD module if possible
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'zTree', 'perfectScrollbar'], factory);
  }
  else if (typeof exports === 'object') {
    // Node/CommonJS
    factory(require('jquery'), require('zTree'), require('perfectScrollbar'));
  }
  else if (jQuery) {
    // Otherwise simply initialise as normal, stopping multiple evaluation
    factory(jQuery);
  }
})(window, document);
