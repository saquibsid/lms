function showErrorMessage(message)
{
    new PNotify({
        title: 'Oh No!',
        text: message,
        icon: 'icon-blocked',
        type: 'error',
        addclass: 'bg-danger',
        text_escape: false
    });
}
function showSuccessMessage(message)
{
    new PNotify({
        title: 'Success',
        text: message,
        icon: 'icon-checkmark3',
        type: 'success',
        addclass: 'bg-success',
        text_escape: true
    });
}

function showWarningMessage(message)
{
    new PNotify({
        title: 'Warning',
        text: message,
        icon: 'icon-warning2',
        type: 'success',
        addclass: 'bg-warning',
        text_escape: true
    });
}
function validateEmail(email, message, notify=true)
{
    if (!message)
        message = "Not a valid Email ID";

    var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (!filter.test(email)) {
        if(notify)
            showErrorMessage(message);
        return false;
    } else
        return true;
}

function blockForm(element)
{
    $(element).block({
        message: '<span class="text-semibold"><i class="fa fa-cog fa-spin"></i> Please Wait...</span>',
        overlayCSS: {
            backgroundColor: '#8a8a8a',
            opacity: 0.8,
            cursor: 'wait'
        },
        css: {
            border: 0,
            padding: '10px 15px',
            color: '#fff',
            width: 'auto',
            '-webkit-border-radius': 2,
            '-moz-border-radius': 2,
            backgroundColor: '#333'
        }
    });
}

function unblockForm(element)
{
    $(element).unblock();
}


function blockPage()
{
    $.blockUI({
        message: '<i class="fa fa-cog fa-spin"></i> Please Wait...',
        overlayCSS: {
            backgroundColor: '#1b2024',
            opacity: 0.8,
            cursor: 'wait'
        },
        css: {
            border: 0,
            color: '#fff',
            padding: 0,
            backgroundColor: 'transparent'
        }
    });
}

function unblockPage()
{
    $.unblockUI();
}


function confirmDelete(message, handler)
{
    var notice = new PNotify({
        title: 'Confirmation',
        text: '<p>' + message + '</p>',
        hide: false,
        type: 'warning',
        icon: 'icon-warning2',
        confirm: {
            confirm: true,
            buttons: [
                {
                    text: 'Yes',
                    addClass: 'btn-sm btn-success'
                },
                {
                    addClass: 'btn-sm btn-danger'
                }
            ]
        },
        buttons: {
            closer: false,
            sticker: false
        },
        history: {
            history: false
        }
    });

    notice.get().on('pnotify.confirm', handler);
}