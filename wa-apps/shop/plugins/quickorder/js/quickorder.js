/*
 * @author Gaponov Igor <gapon2401@gmail.com>
 */
jQuery(document).ready(function($) {
    $.quickorder = {
        init: function() {
            $(document).on("click", ".quickorder-form input[type='submit'], .quickorder-custom-form.cancel-popup input[type='submit']", function() {
                $.quickorder.formHandler($(this));
                return false;
            });

            var form = $("#cart-form");
            var productId = form.find("[name='product_id']").val();
            var checkInputAvailible = function(input) {
                if (input.data('disabled')) {
                    $(".quickorder-custom-button, .quickorder-custom-form.cancel-popup").hide();
                } else {
                    $(".quickorder-custom-button, .quickorder-custom-form.cancel-popup").show();
                    if (typeof $.quickorder.features[productId][input.val()] !== 'undefined') {
                        $.quickorder.skuName[productId] = $.quickorder.features[productId][input.val()].name;
                    }
                }
            };

            var checkSkuAvailible = function(select) {
                // Проверяем какой из скриптов для вывода характеристик используется
                if (typeof sku_features !== 'undefined' && $.quickorder.features !== undefined && $.quickorder.features[productId] === undefined) {
                    $.quickorder.features[productId] = sku_features;
                } 
                if ($.quickorder.features === undefined || $.quickorder.features[productId] === undefined) {
                    return false;
                }

                var key = "";
                select.filter("select, :checked, :hidden").each(function() {
                    key += $(this).data('feature-id') + ':' + $(this).val() + ';';
                });
                var sku = $.quickorder.features[productId][key];
                if (sku) {
                    if (sku.available) {
                        $(".quickorder-custom-button, .quickorder-custom-form.cancel-popup").show();
                        $.quickorder.skuName[productId] = sku.name;
                    } else {
                        $(".quickorder-custom-button, .quickorder-custom-form.cancel-popup").hide();
                    }
                } else {
                    $(".quickorder-custom-button, .quickorder-custom-form.cancel-popup").hide();
                }
            };

            // Если выбрали товар, которого нету, то скрываем кнопку быстрого заказа
            var skus = form.find("#product-skus input[type=radio]").length ? form.find("#product-skus input[type=radio]") : form.find(".skus input[type=radio]");
            skus.click(function() {
                checkInputAvailible($(this));
            });
            if (skus.length) {
                checkInputAvailible(skus.filter(':checked'));
            }
            var skuFeature = form.find(".sku-feature");
            skuFeature.change(function() {
                checkSkuAvailible(skuFeature);
            });
            if (skuFeature.length) {
                checkSkuAvailible(skuFeature);
            }
        },
        stopInit: 0,
        locale: '',
        messages: {
            "The shopping cart is empty": "Корзина пуста",
            "Total": "Сумма заказа",
            "Wait, please. Redirecting": "Идет перенаправление",
            "Something wrong": "Произошла ошибка"
        },
        productFormData: [],
        isCartSubmit: false,
        aftercallback: "",
        skuName: [],
        features: {},
        // Всплывающая форма
        dialog: {
            show: function(btn, cartSubmit) {
                $.quickorder.isCartSubmit = cartSubmit ? true : false;
                $("body").children(".quickorder-custom-form").remove();
                btn = $(btn);
                var form = $("#cart-form-quickview").length ? $("#cart-form-quickview") : ($("#cart-form").length ? $("#cart-form") : btn.closest("form"));
                var productId = form.find("[name='product_id']").val();
                if ($("#cart-form").length || !cartSubmit) {
                    $.quickorder.productFormData = form.serializeArray() || [];
                }
                var quickorderWrap = btn.parent().next(".quickorder-custom-form").clone();
                quickorderWrap.find(":disabled").prop("disabled", false);
                if ($.quickorder.skuName[productId]) {
                    quickorderWrap.find(".quickorder-order-name").append("<span class='quickorder-sku'> (" + $.quickorder.skuName[productId] + ")</span>");
                }
                quickorderWrap.find(".quickorder-quantity input").val(form.find("input[name='quantity']").val());
                quickorderWrap.appendTo("body").show().find(".quickorder-body").wrap("<form action='about:blank' class='quickorder-form' onsubmit='return false;'></form>");
                $("<div class='quickorder-overlay'></div>").click(function() {
                    $("body > .quickorder-custom-form").remove();
                    $(this).remove();
                }).appendTo("body");
                $.quickorder.autoSize(quickorderWrap);
                if (cartSubmit) {
                    $.post(cartSubmit, {}, function(response) {
                        var html = $.quickorder.translate("The shopping cart is empty");
                        if (response.status == 'ok' && response.data) {
                            html = "<div class='quickorder-total'>" + $.quickorder.translate("Total") + ": <b>" + response.data + "</b></div>";
                        }
                        quickorderWrap.find(".quickorder-order").html(html);
                        $.quickorder.autoSize(quickorderWrap);
                    }, "json");
                }
            },
            hide: function(btn) {
                btn = $(btn);
                btn.closest(".quickorder-custom-form").fadeOut(function() {
                    $(this).remove();
                });
                $(".quickorder-overlay").fadeOut(function() {
                    $(this).remove();
                });
            }
        },
        // Обработчик формы
        formHandler: function(btn) {
            var form = btn.closest(".quickorder-custom-form");
            var errormsg = form.find(".errormsg");
            errormsg.text("");

            btn.next("i.icon16").remove();
            // Проверяем заполнены ли все поля формы
            var required = false;
            $.each(form.find(".f-required"), function(i, elem) {
                elem = $(elem);
                if ($.trim(elem.val()) == '') {
                    required = true;
                    $.quickorder.fieldIsEmpty(elem);
			
                }
            });
            if (required) {
					
                return false;
            }
            btn.attr('disabled', 'disabled').after("<i class='icon16 qp loading temp-loader'></i>");
            var data = form.find("input, select, textarea").serializeArray();
            var cartData = $.quickorder.productFormData;
            if (form.hasClass("cancel-popup")) {
                if ($("#cart-form").length) {
                    cartData = $("#cart-form").serializeArray();
                } else {
                    cartData = form.closest("form").serializeArray();
                }
            }
            
            var mergeData = data.concat(cartData);
            var uniqueData = [];
            var tempData = {};

            for (var i = 0; i < mergeData.length; i++) {
                if (typeof tempData[mergeData[i].name] == 'undefined' || (typeof tempData[mergeData[i].name] !== 'undefined' && tempData[mergeData[i].name] !== mergeData[i].value && $.trim(mergeData[i].value) !== '')) {
                    tempData[mergeData[i].name] = mergeData[i].value;
                    uniqueData.push(mergeData[i]);
                }
            }
            if ($.quickorder.isCartSubmit || (form.hasClass("cancel-popup") && form.hasClass("submit-cart"))) {
                uniqueData.push({name: "isCartSubmit", value: "1"});
            }
            $.ajax({
                url: form.find(".quickorder-wrap").data('action'),
                data: uniqueData,
                dataType: "json",
                type: "post",
                success: function(response) {
                    btn.removeAttr('disabled').next(".temp-loader").remove();
                    if (typeof response.errors !== 'undefined') {
                        errormsg.append(response.errors + "<br />");
                    } else if (response.status == 'ok' && response.data) {
							
                        if ($.quickorder.aftercallback) {
                            var func = new Function('params', $.quickorder.aftercallback);
                            func(response.data.params);
                        }
                        if (response.data.redirect) {
                            form.find(".quickorder-body").html("<i class='icon16 qp loading'></i> " + $.quickorder.translate("Wait, please. Redirecting"));
                            location.href = response.data.redirect;
                        } else {
                            form.find(".quickorder-body").html(response.data.text);
                        }
                    } else {
                        btn.after("<i class='icon16 qp no'></i>");
                    }
                },
                error: function() {
                    errormsg.text($.quickorder.translate("Something wrong"));
                    btn.removeAttr('disabled').next(".temp-loader").remove();
                    btn.after("<i class='icon16 qp no'></i>");
                }
            });
            return false;
        },
        // Добавление класса для пустого поля
        fieldIsEmpty: function(field) {
            field.addClass('quickorder-empty-field').click(function() {
                $(this).removeClass("quickorder-empty-field");
            });
        },
        translate: function(message) {
            if (this.locale == 'ru_RU' && typeof this.messages[message] !== 'undefined' && this.messages[message] !== '') {
                return this.messages[message];
            }
            return message;
        },
        autoSize: function(elem) {
            var quickorder = elem.find(".quickorder-wrap");
            var height = quickorder.height();
            var width = quickorder.width();
            var wh = $(window).height();
            var ww = $(window).width();
            if (height > wh) {
                quickorder.find(".quickorder-body").css('height', (wh - 90) + "px");
            }
            if (width > ww) {
                quickorder.width(ww-10);
            }
            quickorder.center();
        }
    };
    $(function() {
        if ($.quickorder.stopInit == 0) {
            $.quickorder.stopInit++;
            $.quickorder.init();
        }
    });
});
jQuery.fn.center = function() {
    this.css("marginTop", (-1) * Math.max(0, $(this).outerHeight() / 2) + "px");
    this.css("marginLeft", (-1) * Math.max(0, $(this).outerWidth() / 2) + "px");
    return this;
};