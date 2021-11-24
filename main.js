// Đối tượng 'Validator'
function Validator(options) {

    // Tìm thẻ cha của chỗ lấy input
    function getParent(element, selector) {
        while(element.parentElement){
            if(element.parentElement.matches(selector)){
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {};

    // Hàm thực hiện validate --> nhận vào 1 quy tắc và thẻ input
    // trả về có lỗi hay không? đồng thời hiển thị cảnh báo lỗi khi nhập sai
    function validate(inputElement, rule) {
        var errorMessage;
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        // Lấy các rules của 1 selector
        var rules = selectorRules[rule.selector];

        // Lặp qua từng rules và kiểm tra
        // Nếu có lỗi thì dừng luôn
        for (var i = 0; i < rules.length; ++i) {
            switch(inputElement.type){
                case 'radio' :
                case 'checkbox' :
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                        );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage) break;
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid')
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid1')
        } else {
            if (errorMessage === null) {
                errorElement.innerText = 'Mật khẩu chính xác';
                getParent(inputElement, options.formGroupSelector).classList.add('invalid1')
            } 
            else {
                errorElement.innerText = '';
                getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
            }
        }
        return !errorMessage;
    }

    // Hàm lấy element form là cái form chứa tất cả thẻ input bên trong 
    var formElement = document.querySelector(options.form)
    if (formElement) {
        // Bỏ hành vi mặc định khi gửi form
        formElement.onsubmit = function (e) {
            e.preventDefault();
            var isFormValid = true;

            // Lặp qua từng rule thì validate ngay
            options.rules.forEach(rule => {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule);
                if (!isValid) {
                    isFormValid = false;
                }
            });
           
            // Nếu không có lỗi nào trong form
            if (isFormValid) {
                // Trường hợp Submit với javascrip
                if (typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]:not(disable)')
                    var formValues = Array.from(enableInputs).reduce(function (values, input){

                        switch(input.type){
                            case 'radio' :
                                values[input.name] = formElement.querySelector('input[name="'+ input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                if(!input.matches(':checked')){
                                    values[input.name] = [];
                                    return values;
                                }
                                if(!Array.isArray(values[input.name])){
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;

                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default :
                            values[input.name] = input.value;
                        }
                        return  values;
                    }, {})
                    options.onSubmit(formValues)
                }

                // Trường hợp Submit mặc định
                else {
                    formElement.onSubmit();
                }
            }
        }
        // Lặp qua mỗi rule và xử lí ( lắng nghe sự kiện)
        options.rules.forEach(rule => {

            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);

            Array.from(inputElements).forEach(function(inputElement) {
                
                // Xử lí blur
                inputElement.onblur = function () {
                    validate(inputElement, rule);
                }

                // Xử lí khi người dùng nhập
                inputElement.oninput = function () {
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
                    errorElement.innerText = '';
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
                }
            })
        });
    }

}

// Định nghĩa các rules để kiểm tra người dùng nhập sai,
// nhận đối số là id thẻ input và String message để hiển thị 
// hàm trả vể đối tượng gồm id thẻ input và String message nếu có lỗi
// (undefined nếu không phát hiện lỗi)
Validator.isRequired = function (selector, message) {
    return {
        selector,
        test: function (value) {
            return value ? undefined : message ;
        }
    }
}
Validator.isEmail = function (selector) {
    return {
        selector,
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Trường này phải là Email !'
        }
    }
}
Validator.minLength = function (selector, min) {
    return {
        selector,
        test: function (value) {
            return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} kí tự !`
        }
    }
}
Validator.isConfirmed = function (selector, getConfirmValue, message) {
    return {
        selector,
        test: function (value) {
            return value === getConfirmValue() ? null : message
        }
    }
}