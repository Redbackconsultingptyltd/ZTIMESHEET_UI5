

jQuery.sap.require("sap.ca.ui.dialog.factory");
jQuery.sap.declare("ZHR_TIMESHEET_UI5.utils.UIHelper");
ZHR_TIMESHEET_UI5.utils.UIHelper = (function () {
	var _ = null;
	var a = null;
	var b = false;
	var c = [];
	var d = false;
	var e = false;
	var f = null;
	return {
		setControllerInstance: function (C) {
			_ = C;
		},
		getControllerInstance: function () {
			return _;
		},
		/*setRoutingProperty: function (o) {
			if (o) {
				for (var i = 0; i < o.length; i++) {
					var l = o[i].LeaveKey;
					var r = o[i].RequestID;
					if (r !== "") {
						o[i]._navProperty = r;
					} else {
						o[i]._navProperty = l;
					}
				}
			}
			a = o;
		},*/
		/*getRoutingProperty: function () {
			return a;
		},
		setIsLeaveCollCached: function (i) {
			b = i;
		},
		getIsLeaveCollCached: function () {
			return b;
		},
		setIsWithDrawn: function (i) {
			c.push(i);
		},
		getIsWithDrawn: function (i) {
			if (jQuery.inArray(i, c) >= 0) return true;
			else return false;
		},
		setIsChangeAction: function (s) {
			d = s;
		},
		getIsChangeAction: function () {
			return d;
		},
		setIsWithDrawAction: function (s) {
			e = s;
		},
		getIsWithDrawAction: function () {
			return e;
		},
		setPernr: function (p) {
			f = p;
		},
		getPernr: function () {
			return f;
		},*/
		errorDialog: function (m) {
			var g = "";
			var h = "";
			var j = "";
			var s = "";
			if (typeof m === "string") {
				s = {
					message: m,
					type: sap.ca.ui.message.Type.ERROR
				};
			} else if (m instanceof Array) {
				for (var i = 0; i < m.length; i++) {
					g = "";
					if (typeof m[i] === "string") {
						g = m[i];
					} else if (typeof m[i] === "object") {
						g = m[i].value;
					}
					g.trim();
					if (g !== "") {
						if (i === 0) {
							h = g;
						} else {
							j = j + g + "\n";
						}
					}
				}
				if (j == "") {
					s = {
						message: h,
						type: sap.ca.ui.message.Type.ERROR
					};
				} else {
					s = {
						message: h,
						details: j,
						type: sap.ca.ui.message.Type.ERROR
					};
				}
			}
			sap.ca.ui.message.showMessageBox(s);
		}
	};
}());