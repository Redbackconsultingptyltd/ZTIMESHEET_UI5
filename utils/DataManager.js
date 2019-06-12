jQuery.sap.declare("ZHR_TIMESHEET_UI5.utils.DataManager");
ZHR_TIMESHEET_UI5.utils.DataManager = (function () {
	var _ = null;
	var d = null;
	var f = {};
	f.exist = true;
	return {
		init: function (D, o) {
			_ = D;
			//	_.setCountSupported(false);
			d = o;
		},
		getBaseODataModel: function () {
			return _;
		},
		setCachedModelObjProp: function (p, a) {
			f[p] = a;
		},
		getCachedModelObjProp: function (p) {
			return f[p];
		},
		getApprover: function (s, a) {
			var p = "DelegateSet"; //""ApproverCollection";
			var b = ["$select=Name,Pernr"];
			this._getOData(p, null, b, function (o) {
				var A, c;
				try {
					var r = o.results;
					if (r instanceof Array) {
						for (var i = 0; i < r.length; i++) {
							A = r[i].Name;
							c = r[i].Pernr;
						}
					}
					if (A === undefined) {
						a([d.getText("LR_DD_NO_APPROVER") + " (DataManager.getApprover)"]);
						return;
					}
				} catch (e) {
					a([d.getText("LR_DD_PARSE_ERR") + " (DataManager.getApprover)"]);
					return;
				}
				s(A, c);
			}, function (o) {
				//a(hcm.myleaverequest.utils.DataManager.parseErrorMessages(o));
			});
		},

		parseErrorMessages: function (o) {
			if (o.response && o.response.body) {
				var c = function (p) {
					var s = 1;
					if (p[0] === "-") {
						s = -1;
						p = p.substr(1);
					}
					return function (a, b) {
						var g;
						if (a[p] < b[p]) {
							g = -1;
						} else if (a[p] > b[p]) {
							g = 1;
						} else {
							g = 0;
						}
						return g * s;
					};
				};
				try {
					var r = JSON.parse(o.response.body);
					if (r.error && r.error.message && r.error.message.value) {
						var g = [];
						g.push(r.error.message.value);
						if (r.error.innererror && r.error.innererror.errordetails && r.error.innererror.errordetails instanceof Array) {
							r.error.innererror.errordetails.sort(c("severity"));
							for (var i = 0; i < r.error.innererror.errordetails.length; i++) {
								if (r.error.innererror.errordetails[i].message) {
									var m = r.error.innererror.errordetails[i].message;
									if (r.error.innererror.errordetails[i].severity) {
										m += " (" + r.error.innererror.errordetails[i].severity + ")";
									}
									g.push(m);
								}
							}
						}
						return g;
					}
				} catch (e) {
					jQuery.sap.log.warning("couldn't parse error message", ["parseErrorMessages"], ["DataManger"]);
				}
			} else {
				return [d.getText("LR_DD_GENERIC_ERR") + o.message];
			}
		},

		searchApprover: function (s, a) {
			var p = "DelegateSet";
			var b = '';
			if (!isNaN(s)) {
				b = s;
			}
			s = encodeURIComponent(s);
			var c = ["$filter=Name eq '" + s + "' and Pernr eq '" + b + "'"];
			this._getOData(p, null, c, function (o) {
				try {
					var r = o.results;
					if (r instanceof Array) {
						a(o);
					}
				} catch (e) {
				
					return;
				}
			}, function (o) {
			
			});
		},

		_getOData: function (p, c, u, s, e) {
			_.read(p, c, u, true, function (r) {
				s(r);
			}, function (r) {
				e(r);
			});
		},

		_postOData: function (p, b, s, e) {
			// debugger;
			_.create(p, b, null, s, e);
			// debugger;
		},

		_deleteOData: function (p, s, e) {
			var P = {};
			P.fnSuccess = s;
			P.fnError = e;
			_.remove(p, P);
		},

	};
}());