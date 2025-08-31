(function () {
    window.mart = window.mart || {};

    window.mart.confirmSubmit = function (message) {
        return window.confirm(message || "Are you sure?");
    };
})();
