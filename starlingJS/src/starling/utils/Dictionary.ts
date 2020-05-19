module StarlingJS {
    export class Dictionary {
        private _values;
        private _keys;
        constructor() {
            this._values = [];
            this._keys = [];
        }

        set(key, value) {
            var index = this.indexOf(key);
            if (index >= 0) {
                this._values[index] = value;
                return;
            }
            this._keys.push(key);
            this._values.push(value);
        }

        /**
        *获取指定对象的键名索引。
        *@param key 键名对象。
        *@return 键名索引。
        */
        indexOf(key) {
            var index = this._keys.indexOf(key);
            if (index >= 0) return index;
            key = ((typeof key == 'string')) ? Number(key) : (((typeof key == 'number')) ? key.toString() : key);
            return this._keys.indexOf(key);
        }

        /**
        *返回指定键名的值。
        *@param key 键名对象。
        *@return 指定键名的值。
        */
        get(key) {
            var index = this.indexOf(key);
            return index < 0 ? null : this._values[index];
        }

        /**
        *移除指定键名的值。
        *@param key 键名对象。
        *@return 是否成功移除。
        */
        remove(key) {
            var index = this.indexOf(key);
            if (index >= 0) {
                this._keys.splice(index, 1);
                this._values.splice(index, 1);
                return true;
            }
            return false;
        }

        /**
        *清除此对象的键名列表和键值列表。
        */
        clear() {
            this._values.length = 0;
            this._keys.length = 0;
        }

        /**
        *获取所有的子元素列表。
        */
        get values() {
            return this._values;
        }
        /**
        *获取所有的子元素键名列表。
        */
        get keys() {
            return this._keys;
        }

        
    }
}
