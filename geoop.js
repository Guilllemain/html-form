if (!window.geoop) window.geoop =
    {
        options: {
            debug: false,
            customTitles: {
                'request-type': 'Request Type',
                'request-type-job': 'Job Request',
                'request-type-quote': 'Quote Request',
                'request-details': 'Request Details',
                'first-name': 'First Name',
                'last-name': 'Last Name',
                'phone': 'Phone',
                'email': 'Email',
                'address-1': 'Address',
                'address-2': 'Address 2',
                'city': 'City',
                'stpr': 'State',
                'postcode': 'Postcode',
                'preferred-time': 'Preferred Time',
                'submit': 'Submit',
                'submitting': 'Submitting...',
                'error-blank-fields': 'Some of the required fields in the form were left blank. Please fill out the highlighted fields before submitting the form.',
                'success': 'Your job request has been submitted successfully. Thank you!'
            },
            connection: {
                'scheme': 'https://',
                'domain': 'www.geoop.com'
            }
        },
        optionsSent: {},
        token: null,
        placeholder: "#geoop-form-placeholder",
        required: [
            'geoop-form-request-type',
            'geoop-form-request-details',
            'geoop-form-first-name',
            'geoop-form-last-name',
            'geoop-form-phone',
            'geoop-form-email',
            'geoop-form-address-1',
            'geoop-form-city',
            'geoop-form-job-start-date',
            'geoop-form-job-start-hour',
            'geoop-form-job-start-minute'
        ],
        optional: [
            'geoop-form-address-2',
            'geoop-form-stpr',
            'geoop-form-postcode'
        ],
        urls: {
            'jquery': 'http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
            'jqui': '{DOMAIN}/form/jquery-ui.min.js',
            'jqcss': '{DOMAIN}/form/jquery-ui.min.css',
            'moment': '{DOMAIN}/form/moment.js',
            'form': '{DOMAIN}/form/',
            'formcss': '{DOMAIN}/form/form.css'
        },

        load: function (token, options) {
            
            if (token) geoop.token = token;

            if (null !== options && "undefined" !== typeof options && "object" !== typeof options) {
                try {
                    console.log("Second parameter of the geoop.load() function must be an object. A " + typeof options + ' received.');
                    console.log("The default settings will be applied and no further debug messages will be displayed.");
                }
                catch (e) { }
            }
            else {
                geoop.optionsSent = options;
            }

            geoop.loadJQ();
        },

        loadJQ: function () {
            var interval = null;
            var iterations = 0;

            if (typeof jQuery === 'undefined') {
                geoop.log("jQuery library was not found. Requesting it from Google...");
                geoop.requestFile(geoop.urls.jquery, 'js');
            }

            var checkJQ = function () {
                if (typeof jQuery !== 'undefined') {
                    clearInterval(interval);
                    geoop.log("jQuery library loaded.");
                    geoop.setOptions();
                }
                else if (iterations > 50) {
                    clearInterval(interval);
                    geoop.log("Error: Request timeout (jQuery).");
                }

                iterations++;
            };

            interval = setInterval(checkJQ, 500);
        },

        setOptions: function () {
            geoop.log("Setting options...");

            jQuery.extend(true, geoop.options, geoop.optionsSent || {});
            jQuery.each(geoop.urls, function (index, url) {
                geoop.urls[index] = url.replace("{DOMAIN}", geoop.options.connection.scheme + geoop.options.connection.domain);
            });

            geoop.log("Options set.");
            geoop.loadUI();
        },

        loadUI: function () {
            var interval = null;
            var iterations = 0;

            if (typeof jQuery.datepicker === 'undefined') {
                geoop.log("jQuery UI library was not found. Requesting it from GeoOp...");
                geoop.requestFile(geoop.urls.jqui, 'js');
                geoop.requestFile(geoop.urls.jqcss, 'css');
            }

            var checkUI = function () {
                if (typeof jQuery.datepicker !== 'undefined') {
                    clearInterval(interval);
                    geoop.log("jQuery UI library loaded.");
                    jQuery(document).ready(geoop.requestForm);
                }
                else if (iterations > 50) {
                    clearInterval(interval);
                    geoop.log("Error: Request timeout (jQuery UI).");
                }

                iterations++;
            };

            interval = setInterval(checkUI, 500);
        },

        requestForm: function () {
            geoop.placeholder = jQuery(geoop.placeholder);

            if (!geoop.placeholder.length) return geoop.log("Placeholder not found. Please make sure you have included an element with ID 'geoop-form-placeholder' into this page.");

            geoop.log("Requesting form from GeoOp...");

            geoop.requestFile(geoop.urls.moment, 'js');
            geoop.requestFile(geoop.urls.formcss, 'css');

            jQuery.ajax(
                {
                    dataType: "json",
                    crossDomain: true,
                    type: "GET",
                    cache: false,
                    url: geoop.urls.form,
                    timeout: 30000,
                    data:
                    {
                        token: geoop.token
                    },
                    error: console.log(geoop.urls.form),
                    success: function (data) {
                        if (true === data.isError) return geoop.parseResponseError(data);

                        geoop.log("Form code received. Inserting it into the page...");

                        geoop.placeholder.html(data.html);

                        geoop.applyCustomTitles();
                        geoop.bindEvents();
                    }
                });
        },

        applyCustomTitles: function () {
            geoop.log("Applying custom titles...");

            jQuery.each(geoop.options.customTitles, function (id, title) {
                if ('postcode' == id) jQuery('input#geoop-form-postcode').attr('placeholder', title);
                else jQuery('#geoop-form-custom-title-' + id).text(title);
            });

            geoop.log("Done.");
        },

        bindEvents: function () {
            jQuery("input#geoop-form-job-start-date")
                .datepicker({
                    defaultDate: '+0',
                    dateFormat: "dd M yy",
                    minDate: "+0",
                    maxDate: "+1y",
                    firstDay: 1,
                    numberOfMonths: 1,
                    showOtherMonths: true,
                    selectOtherMonths: true
                });

            jQuery.each(geoop.required, function (index, id) {
                var field = jQuery("#" + id);

                field.bind('focus', function () { field.removeClass('geoop-form-invalid'); });
            });

            jQuery("button#geoop-form-submit").bind('click', geoop.submitForm);
        },

        submitForm: function () {
            var date = new Date();
            var button = jQuery(this);
            var message = jQuery("span.geoop-form-submitting");
            var invalid = false;
            var data = {
                token: geoop.token,
                offset: date.getTimezoneOffset()
            };

            try {
                button.prop('disabled', true);
            }
            catch (e) {
                button.attr("disabled", 'disabled');
            }
            finally {
                message.show();
            }

            geoop.log("Starting validation...");

            jQuery.each(geoop.required, function (index, id) {
                var elem = jQuery("#" + id);

                data[id] = elem.val();

                if (data[id]) return;

                geoop.log("Field " + id + " is invalid.");

                elem.addClass('geoop-form-invalid');

                invalid = true;
            });

            jQuery.each(geoop.optional, function (index, id) {
                var elem = jQuery("#" + id);

                data[id] = elem.val();
            });

            if (false !== invalid) {
                alert(geoop.options.customTitles['error-blank-fields']);

                try {
                    button.prop('disabled', false);
                }
                catch (e) {
                    button.removeAttr("disabled");
                }
                finally {
                    message.hide();
                }

                return;
            }

            geoop.log("All fields are valid.");
            geoop.log("Converting selected date to UTC timestamp...");

            var timestamp = moment(data["geoop-form-job-start-date"]);

            timestamp.hour(data["geoop-form-job-start-hour"]).minute(data["geoop-form-job-start-minute"]).utc();

            data['geoop-form-job-start-timestamp'] = timestamp.unix();

            geoop.log("Done. Submitting form...");

            jQuery.ajax(
                {
                    dataType: "json",
                    crossDomain: true,
                    type: "POST",
                    cache: false,
                    url: geoop.urls.form,
                    timeout: 30000,
                    data: data,
                    error: geoop.parseXHRError,
                    success: function (data) {
                        if (true === data.isError) {
                            if (data.code > 1300) alert(data.message + ": " + data.description);
                            else geoop.parseResponseError(data);

                            try {
                                button.prop('disabled', false);
                            }
                            catch (e) {
                                button.removeAttr("disabled");
                            }
                            finally {
                                message.hide();
                            }

                            return;
                        }

                        geoop.log("Data successfully submitted.");

                        geoop.placeholder.html(data.html);

                        geoop.applyCustomTitles();
                    }
                });
        },

        requestFile: function (url, type) {
            if ('js' === type) {
                var fileref = document.createElement('script');
                fileref.setAttribute("type", "text/javascript");
                fileref.setAttribute("src", url);
            }
            else if ('css' === type) {
                var fileref = document.createElement("link");
                fileref.setAttribute("rel", "stylesheet");
                fileref.setAttribute("type", "text/css");
                fileref.setAttribute("href", url);
            }

            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(fileref);
        },

        parseXHRError: function (xhr) {
            var button = jQuery("button#geoop-form-submit");
            var message = jQuery("span.geoop-form-submitting");

            switch (xhr.status) {
                case 200:
                    //That's not an error
                    return;
                    break;

                case 401:
                    geoop.log("Unauthorised. Please make sure you provided your token when making a request.");
                    break;

                case 426:
                    geoop.log("Invalid Protocol. Please make sure you are using secure connection when making a request.");
                    break;

                default:
                    geoop.log("Error response with code " + xhr.status + " received from the GeoOp server.");
                    break;
            }

            try {
                button.prop('disabled', false);
            }
            catch (e) {
                button.removeAttr("disabled");
            }
            finally {
                message.hide();
            }
        },

        parseResponseError: function (data) {
            geoop.log("Error " + data.code + " (" + data.message + "): " + data.description);
            return;
        },

        log: function (message) {
            if (false === geoop.options.debug) return;

            if ('alert' != geoop.options.debug && console && console.log) console.log("GeoOp Form: " + message);
            else alert("GeoOp Form: " + message);
        }
    };