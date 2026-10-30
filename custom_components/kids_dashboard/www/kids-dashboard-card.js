// node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: ee, getOwnPropertySymbols: te, getPrototypeOf: ne } = Object, f = globalThis, p = f.trustedTypes, re = p ? p.emptyScript : "", ie = f.reactiveElementPolyfillSupport, m = (e, t) => e, h = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? re : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, g = (e, t) => !l(e, t), _ = {
	attribute: !0,
	type: String,
	converter: h,
	reflect: !1,
	useDefault: !1,
	hasChanged: g
};
Symbol.metadata ??= Symbol("metadata"), f.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var v = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = _) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? _;
	}
	static _$Ei() {
		if (this.hasOwnProperty(m("elementProperties"))) return;
		let e = ne(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(m("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(m("properties"))) {
			let e = this.properties, t = [...ee(e), ...te(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? h : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? h : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? g)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
v.elementStyles = [], v.shadowRootOptions = { mode: "open" }, v[m("elementProperties")] = /* @__PURE__ */ new Map(), v[m("finalized")] = /* @__PURE__ */ new Map(), ie?.({ ReactiveElement: v }), (f.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var y = globalThis, b = (e) => e, x = y.trustedTypes, S = x ? x.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, C = "$lit$", w = `lit$${Math.random().toFixed(9).slice(2)}$`, T = "?" + w, ae = `<${T}>`, E = document, D = () => E.createComment(""), O = (e) => e === null || typeof e != "object" && typeof e != "function", k = Array.isArray, oe = (e) => k(e) || typeof e?.[Symbol.iterator] == "function", A = "[ 	\n\f\r]", j = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, M = /-->/g, N = />/g, P = RegExp(`>|${A}(?:([^\\s"'>=/]+)(${A}*=${A}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), F = /'/g, I = /"/g, se = /^(?:script|style|textarea|title)$/i, ce = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), L = ce(1), R = ce(2), z = Symbol.for("lit-noChange"), B = Symbol.for("lit-nothing"), V = /* @__PURE__ */ new WeakMap(), H = E.createTreeWalker(E, 129);
function U(e, t) {
	if (!k(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return S === void 0 ? t : S.createHTML(t);
}
var le = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = j;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === j ? c[1] === "!--" ? o = M : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = P) : (se.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = P) : o = N : o === P ? c[0] === ">" ? (o = i ?? j, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? P : c[3] === "\"" ? I : F) : o === I || o === F ? o = P : o === M || o === N ? o = j : (o = P, i = void 0);
		let d = o === P && e[t + 1].startsWith("/>") ? " " : "";
		a += o === j ? n + ae : l >= 0 ? (r.push(s), n.slice(0, l) + C + n.slice(l) + w + d) : n + w + (l === -2 ? t : d);
	}
	return [U(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, W = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = le(t, n);
		if (this.el = e.createElement(l, r), H.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = H.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(C)) {
					let t = u[o++], n = i.getAttribute(e).split(w), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? de : r[1] === "?" ? fe : r[1] === "@" ? pe : q
					}), i.removeAttribute(e);
				} else e.startsWith(w) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (se.test(i.tagName)) {
					let e = i.textContent.split(w), t = e.length - 1;
					if (t > 0) {
						i.textContent = x ? x.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], D()), H.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], D());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === T) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(w, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += w.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = E.createElement("template");
		return n.innerHTML = e, n;
	}
};
function G(e, t, n = e, r) {
	if (t === z) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = O(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = G(e, i._$AS(e, t.values), i, r)), t;
}
var ue = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? E).importNode(t, !0);
		H.currentNode = r;
		let i = H.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new K(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new me(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = H.nextNode(), a++);
		}
		return H.currentNode = E, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, K = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = B, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = G(this, e, t), O(e) ? e === B || e == null || e === "" ? (this._$AH !== B && this._$AR(), this._$AH = B) : e !== this._$AH && e !== z && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? oe(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== B && O(this._$AH) ? this._$AA.nextSibling.data = e : this.T(E.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = W.createElement(U(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new ue(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = V.get(e.strings);
		return t === void 0 && V.set(e.strings, t = new W(e)), t;
	}
	k(t) {
		k(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(D()), this.O(D()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = b(e).nextSibling;
			b(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, q = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = B, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = B;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = G(this, e, t, 0), a = !O(e) || e !== this._$AH && e !== z, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = G(this, r[n + o], t, o), s === z && (s = this._$AH[o]), a ||= !O(s) || s !== this._$AH[o], s === B ? e = B : e !== B && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === B ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, de = class extends q {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === B ? void 0 : e;
	}
}, fe = class extends q {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== B);
	}
}, pe = class extends q {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = G(this, e, t, 0) ?? B) === z) return;
		let n = this._$AH, r = e === B && n !== B || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== B && (n === B || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, me = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		G(this, e);
	}
}, he = y.litHtmlPolyfillSupport;
he?.(W, K), (y.litHtmlVersions ??= []).push("3.3.3");
var ge = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new K(t.insertBefore(D(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, J = globalThis, Y = class extends v {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ge(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return z;
	}
};
Y._$litElement$ = !0, Y.finalized = !0, J.litElementHydrateSupport?.({ LitElement: Y });
var _e = J.litElementPolyfillSupport;
_e?.({ LitElement: Y }), (J.litElementVersions ??= []).push("4.2.2");
// src/api.js
var ve = {
	play_pause: "media_play_pause",
	chapter_prev: "media_previous_track",
	chapter_next: "media_next_track"
}, ye = class {
	constructor(e, t) {
		this.hass = e, this.entityId = t;
	}
	library() {
		return this.call("library", { entity_id: this.entityId });
	}
	group(e) {
		return this.call("series", { series_id: e });
	}
	book(e) {
		return this.call("book", { book_id: e });
	}
	async state() {
		let e = await this.call("state", { entity_id: this.entityId });
		return e.book ? e : this.mediaPlayerState() ?? e;
	}
	command(e, t = {}, n = !1) {
		let r = n && ve[e];
		return r ? this.hass.callService("media_player", r, { entity_id: this.entityId }) : this.call("command", {
			entity_id: this.entityId,
			action: e,
			...t
		});
	}
	call(e, t) {
		return this.hass.callWS({
			type: `kids_dashboard/${e}`,
			...t
		});
	}
	mediaPlayerState() {
		let e = this.hass.states[this.entityId];
		if (!e || !["playing", "paused"].includes(e.state) || !e.attributes.media_title) return null;
		let t = e.attributes, n = t.media_position || 0;
		return e.state === "playing" && t.media_position_updated_at && (n += (Date.now() - Date.parse(t.media_position_updated_at)) / 1e3), {
			state: e.state,
			external: !0,
			elapsed: n,
			duration: t.media_duration || 0,
			chapter: null,
			chapters: 0,
			book: {
				id: "",
				title: t.media_title,
				number: "",
				series: t.media_artist || t.media_album_name || "",
				cover: t.entity_picture || ""
			}
		};
	}
}, X = (e) => R`<svg viewBox="0 0 24 24" aria-hidden="true">${e}</svg>`, Z = {
	play: X(R`<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/>`),
	pause: X(R`<rect x="5.5" y="4" width="4.5" height="16" rx="1.5"/><rect x="14" y="4" width="4.5" height="16" rx="1.5"/>`),
	previous: X(R`<rect x="4" y="5" width="3" height="14" rx="1"/><path d="M20 5.7v12.6a1 1 0 0 1-1.55.83L9.3 12.83a1 1 0 0 1 0-1.66l9.15-6.3A1 1 0 0 1 20 5.7z"/>`),
	next: X(R`<rect x="17" y="5" width="3" height="14" rx="1"/><path d="M4 5.7v12.6a1 1 0 0 0 1.55.83l9.15-6.3a1 1 0 0 0 0-1.66L5.55 4.87A1 1 0 0 0 4 5.7z"/>`),
	check: X(R`<path d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/>`),
	restart: X(R`<path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/>`),
	back: X(R`<path d="M15.4 4.6 8 12l7.4 7.4-1.8 1.8L4.4 12l9.2-9.2z"/>`)
}, be = 2e3, xe = 4e3, Se = class {
	state = null;
	#e;
	#t;
	#n = null;
	#r = 0;
	#i = 0;
	#a = null;
	constructor(e, t) {
		this.#e = e, this.#t = t, e.addController(this);
	}
	set api(e) {
		this.#t = e;
	}
	get book() {
		return this.state?.book ?? null;
	}
	get playing() {
		return this.state?.state === "playing";
	}
	hostConnected() {
		this.#n = setInterval(() => this.poll(), be), this.poll();
	}
	hostDisconnected() {
		clearInterval(this.#n), this.#n = null;
	}
	expect(e) {
		this.#a = {
			state: e,
			until: Date.now() + xe
		}, this.state && (this.state = {
			...this.state,
			state: e
		}, this.#e.requestUpdate());
	}
	async command(e, t = {}) {
		try {
			await this.#t?.command(e, t, this.state?.external);
		} finally {
			this.poll();
		}
	}
	async poll() {
		if (!this.#t || document.hidden) return;
		let e = ++this.#r, t = await this.#t.state().catch(() => null);
		e < this.#i || (this.#i = e, this.state = this.#o(t), this.#e.requestUpdate());
	}
	#o(e) {
		let t = this.#a;
		return !e || !t ? e : e.state === t.state || Date.now() > t.until ? (this.#a = null, e) : {
			...e,
			state: t.state
		};
	}
}, Ce = o`
    :host {
        display: block;
        height: var(--kids-dashboard-height, 100vh);
    }

    ha-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        padding: 0;
        background: var(--ha-card-background, var(--card-background-color));
    }

    svg {
        display: block;
        width: 100%;
        height: 100%;
        fill: currentColor;
    }

    button {
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    /* Header and content */

    header {
        display: flex;
        flex: none;
        align-items: center;
        gap: 12px;
        min-height: 48px;
        padding: 12px 16px 6px;
    }

    header h1 {
        flex: 1;
        margin: 0;
        overflow: hidden;
        color: var(--primary-text-color);
        font-size: 26px;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .back {
        flex: none;
        width: 48px;
        height: 48px;
        padding: 12px;
        border-radius: 50%;
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
    }

    .content {
        flex: 1;
        min-height: 0;
        padding: 4px 16px 18px;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-width: none;
    }

    .content::-webkit-scrollbar {
        display: none;
    }

    .content.home {
        padding-top: 16px;
    }

    .empty {
        padding: 30px;
        color: var(--secondary-text-color);
        font-size: 17px;
        text-align: center;
    }

    /* Tiles: authors on the home page, books in a group */

    .shelf {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 18px 16px;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 16px;
    }

    .tile {
        display: flex;
        flex-direction: column;
        gap: 7px;
        min-width: 0;
    }

    .cover {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        overflow: hidden;
        border-radius: var(--ha-card-border-radius, 12px);
        background: var(--secondary-background-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    }

    .cover img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .name {
        display: -webkit-box;
        overflow: hidden;
        color: var(--primary-text-color);
        font-size: 16px;
        font-weight: 500;
        line-height: 1.25;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
    }

    .name.single-line {
        display: block;
        margin-top: 2px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .sub {
        margin-top: -3px;
        color: var(--secondary-text-color);
        font-size: 14px;
    }

    .heard {
        position: absolute;
        right: 6px;
        bottom: 6px;
        width: 22px;
        height: 22px;
        padding: 3px;
        border-radius: 50%;
        background: var(--success-color, #43a047);
        color: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
    }

    .progress {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        height: 6px;
        background: rgba(0, 0, 0, 0.5);
    }

    .progress i {
        display: block;
        height: 100%;
        background: var(--primary-color);
    }

    /* A book */

    .book {
        display: flex;
        align-items: flex-start;
        gap: 22px;
    }

    .book .cover {
        flex: none;
        width: 260px;
    }

    .book .side {
        flex: 1;
        min-width: 0;
    }

    .book .meta {
        color: var(--secondary-text-color);
        font-size: 16px;
    }

    .book h3 {
        margin: 4px 0 14px;
        color: var(--primary-text-color);
        font-size: 24px;
        line-height: 1.2;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .action {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        height: 56px;
        padding: 0 24px 0 16px;
        border-radius: 28px;
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
        font-size: 19px;
        font-weight: 600;
    }

    .action svg {
        width: 28px;
        height: 28px;
    }

    .action.secondary {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
    }

    .chapters {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 16px;
    }

    .chapter {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 50px;
        padding: 4px 14px;
        border-radius: 12px;
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
        font-size: 16px;
    }

    .chapter.now {
        outline: 2px solid var(--primary-color);
    }

    .chapter b {
        display: flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 15px;
        background: var(--divider-color);
        font-size: 13px;
        font-weight: 600;
    }

    .chapter span {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .chapter em {
        color: var(--secondary-text-color);
        font-size: 14px;
        font-style: normal;
    }

    /* The player bar */

    .player {
        display: flex;
        flex: none;
        align-items: center;
        gap: 14px;
        padding: 8px 16px;
        border-top: 1px solid var(--divider-color);
        background: var(--secondary-background-color);
        box-shadow: 0 -6px 16px rgba(0, 0, 0, 0.25);
    }

    .now-playing {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 14px;
        min-width: 0;
    }

    .now-playing img {
        flex: none;
        width: 64px;
        height: 64px;
        border-radius: 12px;
        object-fit: cover;
    }

    .now-playing .text {
        flex: 1;
        min-width: 0;
    }

    .now-playing .title,
    .now-playing .detail {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .now-playing .title {
        color: var(--primary-text-color);
        font-size: 18px;
        font-weight: 600;
    }

    .now-playing .detail {
        color: var(--secondary-text-color);
        font-size: 14px;
    }

    .now-playing .bar {
        height: 5px;
        margin-top: 7px;
        overflow: hidden;
        border-radius: 3px;
        background: var(--divider-color);
    }

    .now-playing .bar i {
        display: block;
        height: 100%;
        background: var(--primary-color);
    }

    .control {
        flex: none;
        width: 48px;
        height: 48px;
        padding: 12px;
        border-radius: 50%;
        color: var(--primary-text-color);
    }

    .control.main {
        width: 58px;
        height: 58px;
        padding: 15px;
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
    }
`;
// src/format.js
function we(e) {
	let t = Math.max(0, Math.floor(e || 0)), n = Math.floor(t / 3600), r = Math.floor(t % 3600 / 60), i = String(t % 60).padStart(2, "0");
	return n ? `${n}:${String(r).padStart(2, "0")}:${i}` : `${r}:${i}`;
}
function Q(e) {
	return String(e || "").replace(/^\d+\s*-\s*/, "");
}
function Te(e) {
	return `${e} ${e === 1 ? "Hörspiel" : "Hörspiele"}`;
}
function $(e, t) {
	return e ? e.startsWith("/api/kids_dashboard/img/") ? `${e}?s=${t}` : e : "";
}
// src/views/book.js
var Ee = 30;
function De({ book: e, playback: t, onPlay: n, onRestart: r, onToggle: i }) {
	let a = t.book?.id === e.id, o = a ? t.state.chapter : null;
	return L`
        <div class="book">
            <div class="cover">
                ${e.cover ? L`<img src=${$(e.cover, 512)} alt="">` : ""}
            </div>

            <div class="side">
                <div class="meta">${e.number ? `Folge ${e.number} · ` : ""}${Math.round(e.duration / 60)} Min.</div>
                <h3>${e.title}</h3>

                <div class="actions">
                    ${Oe({
		book: e,
		current: a,
		playing: a && t.playing,
		onPlay: n,
		onToggle: i
	})}
                    ${a || ke(e) ? L`
                        <button class="action secondary" @click=${() => r(e.uri)}>
                            ${Z.restart} Neustart
                        </button>
                    ` : ""}
                </div>

                <div class="chapters">
                    ${(e.chapters ?? []).map((t) => L`
                        <button
                            class="chapter ${o?.start === t.start ? "now" : ""}"
                            @click=${() => n(e.uri, t.start)}
                        >
                            <b>${t.position}</b>
                            <span>${Q(t.name)}</span>
                            <em>${we(t.end - t.start)}</em>
                        </button>
                    `)}
                </div>
            </div>
        </div>
    `;
}
function Oe({ book: e, current: t, playing: n, onPlay: r, onToggle: i }) {
	return t ? L`
            <button class="action" @click=${i}>
                ${n ? L`${Z.pause} Pause` : L`${Z.play} Weiterhören`}
            </button>
        ` : L`
        <button class="action" @click=${() => r(e.uri)}>
            ${Z.play} ${ke(e) ? "Weiterhören" : "Abspielen"}
        </button>
    `;
}
function ke(e) {
	return e.resume > Ee && !e.played;
}
// src/views/group.js
function Ae({ books: e, onOpenBook: t }) {
	return L`
        <div class="grid">
            ${e.map((e) => L`
                <button class="tile" @click=${() => t(e.id)}>
                    <div class="cover">
                        ${e.cover ? L`<img src=${$(e.cover, 256)} loading="lazy" alt="">` : ""}
                        ${je(e)}
                    </div>
                    <div class="name">${e.title}</div>
                </button>
            `)}
        </div>
    `;
}
function je(e) {
	if (e.played) return L`<span class="heard">${Z.check}</span>`;
	let t = e.resume && e.duration ? Math.min(100, e.resume / e.duration * 100) : 0;
	return t <= 1 ? "" : L`<div class="progress"><i style="width: ${t}%"></i></div>`;
}
// src/views/home.js
function Me({ groups: e, onOpenGroup: t, onOpenBook: n }) {
	return e.length ? L`
        <div class="shelf">
            ${e.map((e) => L`
                <button
                    class="tile"
                    @click=${() => e.single ? n(e.single) : t(e.id)}
                >
                    <div class="cover">
                        ${e.covers[0] ? L`<img src=${$(e.covers[0], 256)} alt="">` : ""}
                    </div>
                    <div class="name single-line">${e.name}</div>
                    <div class="sub">${e.single ? e.sub : Te(e.count)}</div>
                </button>
            `)}
        </div>
    ` : L`<div class="empty">Noch keine Hörspiele da.</div>`;
}
// src/views/player-bar.js
function Ne({ playback: e, onOpen: t, onCommand: n }) {
	let r = e.state, i = e.book;
	if (!i) return "";
	let a = r.duration ? Math.min(100, r.elapsed / r.duration * 100) : 0, o = r.chapter ? `Kapitel ${r.chapter.position} von ${r.chapters}: ${Q(r.chapter.name)}` : i.series;
	return L`
        <div class="player">
            <button class="now-playing" aria-label="Zum Hörspiel" @click=${t}>
                <img src=${$(i.cover, 160)} alt="">
                <div class="text">
                    <div class="title">${i.number ? `${i.number} · ` : ""}${i.title}</div>
                    <div class="detail">${o}</div>
                    <div class="bar"><i style="width: ${a.toFixed(1)}%"></i></div>
                </div>
            </button>

            <button class="control" aria-label="Kapitel zurück" @click=${() => n("chapter_prev")}>
                ${Z.previous}
            </button>
            <button class="control main" aria-label="Abspielen oder Pause" @click=${() => n("play_pause")}>
                ${e.playing ? Z.pause : Z.play}
            </button>
            <button class="control" aria-label="Nächstes Kapitel" @click=${() => n("chapter_next")}>
                ${Z.next}
            </button>
        </div>
    `;
}
// src/kids-dashboard-card.js
var Pe = 3e4, Fe = { kind: "home" }, Ie = (e) => e.startsWith("b"), Le = class extends Y {
	static styles = Ce;
	static properties = {
		page: { state: !0 },
		groups: { state: !0 },
		group: { state: !0 },
		book: { state: !0 },
		failed: { state: !0 }
	};
	#e = null;
	#t = null;
	#n = null;
	#r = new Se(this, null);
	constructor() {
		super(), this.page = Fe, this.groups = [], this.group = null, this.book = null, this.failed = !1;
	}
	setConfig(e) {
		if (!e.entity) throw Error("entity: the Music Assistant player to play on");
		this.config = e, e.height && this.style.setProperty("--kids-dashboard-height", e.height);
	}
	set hass(e) {
		let t = !this.#e;
		this.#e = e, this.#t = new ye(e, this.config.entity), this.#r.api = this.#t, t && (this.#l(), this.#r.poll());
	}
	getCardSize() {
		return 12;
	}
	connectedCallback() {
		super.connectedCallback(), this.#n = setInterval(() => this.#u(), Pe);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), clearInterval(this.#n);
	}
	updated(e) {
		e.has("page") && this.renderRoot.querySelector(".content")?.scrollTo(0, 0);
	}
	render() {
		let e = this.page.kind === "home";
		return L`
            <ha-card>
                ${this.#i(e)}

                <div class="content ${e ? "home" : ""}">
                    ${this.#a()}
                </div>

                ${Ne({
			playback: this.#r,
			onOpen: () => this.#s(),
			onCommand: (e) => this.#f(e)
		})}
            </ha-card>
        `;
	}
	#i(e) {
		if (e && !this.config.title) return "";
		let t = {
			home: this.config.title,
			group: this.group?.series.name,
			book: this.book?.series || this.book?.author || "Hörspiel"
		}[this.page.kind];
		return L`
            <header>
                ${e ? "" : L`<button class="back" aria-label="Zurück" @click=${() => this.#o()}>${Z.back}</button>`}
                <h1>${t ?? ""}</h1>
            </header>
        `;
	}
	#a() {
		return this.failed ? L`<div class="empty">Die Hörspiele sind gerade nicht erreichbar. Bitte gleich noch einmal versuchen.</div>` : this.page.kind === "group" && this.group ? Ae({
			books: this.group.books,
			onOpenBook: (e) => this.#c({
				kind: "book",
				id: e
			})
		}) : this.page.kind === "book" && this.book ? De({
			book: this.book,
			playback: this.#r,
			onPlay: (e, t) => this.#d(e, t),
			onRestart: (e) => this.#f("restart", { uri: e }, "playing"),
			onToggle: () => this.#f("play_pause")
		}) : this.page.kind === "home" ? Me({
			groups: this.groups,
			onOpenGroup: (e) => this.#c({
				kind: "group",
				id: e
			}),
			onOpenBook: (e) => this.#c({
				kind: "book",
				id: e
			})
		}) : "";
	}
	#o() {
		let e = this.book?.series_id;
		this.page.kind !== "book" || !e || Ie(e) ? this.#c(Fe) : this.#c({
			kind: "group",
			id: e
		});
	}
	#s() {
		let e = this.#r.book?.id;
		!e || this.page.kind === "book" && this.page.id === e || this.#c({
			kind: "book",
			id: e
		});
	}
	async #c(e) {
		e.kind === "group" && this.group?.series.id !== e.id && (this.group = null), e.kind === "book" && this.book?.id !== e.id && (this.book = null), this.page = e, await this.#l();
	}
	async #l() {
		if (this.#t) try {
			this.page.kind === "group" ? this.group = await this.#t.group(this.page.id) : this.page.kind === "book" ? this.book = await this.#t.book(this.page.id) : this.groups = await this.#t.library(), this.failed = !1;
		} catch {
			this.failed = !0;
		}
	}
	async #u() {
		if (this.page.kind !== "home" || !this.#t) return;
		let e = await this.#t.library().catch(() => null);
		e && JSON.stringify(e) !== JSON.stringify(this.groups) && (this.groups = e);
	}
	#d(e, t) {
		let n = t === void 0 ? { uri: e } : {
			uri: e,
			position: t,
			from_position: !0
		};
		return this.#f("play", n, "playing");
	}
	#f(e, t = {}, n = null) {
		let r = e === "play_pause" && this.#r.state, i = n ?? (r ? this.#r.playing ? "paused" : "playing" : null);
		return i && this.#r.expect(i), this.#r.command(e, t);
	}
};
customElements.define("kids-dashboard-card", Le), window.customCards = window.customCards || [], window.customCards.push({
	type: "kids-dashboard-card",
	name: "Kids Dashboard",
	description: "Ein Bildschirm fürs Kinderzimmer: Hörspiele aus Music Assistant, nach Autor"
});
