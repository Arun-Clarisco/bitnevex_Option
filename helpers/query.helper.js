const mongoose = require('mongoose');
exports.findoneData = async (collection, where, gets, sorts = {}) => {
  try {
    const sorlen = Object.keys(sorts).length;
    if (sorlen != 0) {
      const findone = await collection.findOne({ $query: where }, gets).sort(sorts);
      if (!findone) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: findone };
    } else {
      const findone = await collection.findOne({ $query: where, $orderby: { _id: -1 } }, gets);
      if (!findone) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: findone };
    }
  } catch (e) {
    console.log('findoneData', e, collection, where, gets, sorts = {});
    return { status: false, msg: e.message };
  }
};
exports.findData = async (collection, where, gets, sorts, limits, page) => {

  try {
    const sorlen = Object.keys(sorts).length;
    if (sorlen != 0 && limits != 0) {
      const resData = await collection.find(where, gets).sort(sorts).limit(limits*1).skip((page-1)*limits);
      if (!resData) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: resData };
    } else if (sorlen != 0) {
      const resData = await collection.find(where, gets).sort(sorts);
      if (!resData) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: resData };
    } else if (limits != 0) {
      const resData = await collection.find(where, gets).limit(limits*1).skip((page-1)*limits);
      if (!resData) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: resData };
    } else {
      const resData = await collection.find(where, gets);
      if (!resData) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: resData };
    }
  } catch (e) {
    console.log('findData', e, collection, where, gets, sorts, limits, page);
    return { status: false, msg: e.message };
  }
};
exports.findDatafilter = async (collection, where, gets, sorts, limits,offset) => {
  try {
    const sorlen = Object.keys(sorts).length;
    if (sorlen != 0 && limits != 0) {
      const resData = await collection.find(where, gets).sort(sorts).limit(limits).skip(offset) ;
      if (!resData) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: resData };
    } else if (sorlen != 0) {
      const resData = await collection.find(where, gets).sort(sorts).limit(limits).skip(offset) ;
      if (!resData) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: resData };
    } else if (limits != 0) {
      const resData = await collection.find(where, gets).limit(limits).skip(offset) ;
      if (!resData) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: resData };
    } else {
      const resData = await collection.find(where, gets).limit(limits*1).skip((page-1)*limits) ;;
      if (!resData) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: resData };
    }
  } catch (e) {
    console.log('findDatafilter',e);
    return { status: false, msg: e.message };
  }
};
exports.findPaginationData = async (collection, where, gets, sorts, limits, skip) => {
  try {
    const sorlen = Object.keys(sorts).length;
    if (sorlen != 0 && limits != 0) {
      const resData = await collection.find(where, gets).sort(sorts).skip(skip).limit(limits);
      if (!resData) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: resData };
    } else if (sorlen != 0) {
      const resData = await collection.find(where, gets).sort(sorts).skip(skip);
      if (!resData) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: resData };
    } else if (limits != 0) {
      const resData = await collection.find(where, gets).skip(skip).limit(limits);
      if (!resData) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: resData };
    } else {
      const resData = await collection.find(where, gets).skip(skip);
      if (!resData) {
        return { status: false, msg: 'record not found!' };
      }
      return { status: true, msg: resData };
    }
  } catch (e) {
    console.log('findPaginationData',e);
    return { status: false, msg: e.message };
  }
};
exports.insertData = async (collection, values) => {
  try {
    const inslen = Object.keys(values).length;
    if (inslen != 0) {
      const insData = await collection.create(values);
      if (!insData) {
        return { status: false, msg: 'not inserted' };
      }
      return { status: true, msg: insData };
    } else {
      return { status: false, msg: 'not inserted' };
    }
  } catch (e) {
    console.log('query : insertData', e, collection, values);
    return { status: false, msg: e.message };
  }
};
exports.insertManyData = async function (collection, values) {
	try {
    const inslen = Object.keys(values).length;
    if (inslen != 0) {
      const insData = await collection.insertMany(values)
      if (!insData) {
        return { status: false, msg: 'not inserted' };
      }
      return { status: true, msg: insData };
    } else {
      return { status: false, msg: 'not inserted' };
    }
	} catch (e) {
		console.error("insertManyData", e);
		return(false)
	}
}
exports.updateData = async (collection, updatetype, where, values, options = { new: false}) => {
  try {
    if (updatetype === "many") {
      const updatedata = await collection.updateMany(where, { $set: values });
      if (!updatedata) {
        return { status: false, msg: 'not updated' };
      }
      return { status: true, msg: updatedata };
    } else if (updatetype === "element") {
      const updatedata = await collection.updateMany(where, values);
      if (!updatedata) {
        return { status: false, msg: 'not updated' };
      }
      return { status: true, msg: updatedata };
    } else {
      const updatedata = await collection.updateOne(where, { $set: values }, options);
      if (!updatedata) {
        return { status: false, msg: 'not updated' };
      }
      return { status: true, msg: updatedata };
    }
  } catch (e) {
    console.error("updateData", e, collection, {updatetype, where, values, options});
    return { status: false, msg: e.message };
  }
};
exports.DeleteOne = async (collection, where) => {
  try {
    const delData = await collection.deleteOne(where);
    if (!delData) {
      return { status: false, msg: 'not deleted' };
    }
    return { status: true, msg: delData };
  } catch (e) {
    console.error("DeleteOne", e);
    return { status: false, msg: e.message };
  }
};
exports.DeleteMany = async (collection, where) => {
  try {
    const delData = await collection.deleteMany(where);
    if (!delData) {
      return { status: false, msg: 'not deleted' };
    }
    return { status: true, msg: delData };
  } catch (e) {
    console.error("DeleteMany", e);
    return { status: false, msg: e.message };
  }
};
exports.findApiData = async (collectionName, sorts) => {
  try {
    let collection =  mongoose.model(collectionName);
    const resData = await collection.find().sort(sorts);
    if (!resData) {
      return { status: false, data: [] };
    }
    return { status: true, data: resData };
  } catch (e) {
    console.log('findApiData', e)
    return { status: false, data: [] };
  }
};
exports.insertApiManyData = async function (collectionName, values) {
	try {
    let collection =  mongoose.model(collectionName);
    const insData = await collection.insertMany(values)
    if (!insData) {
      return { status: false, msg: 'not inserted' };
    }
    return { status: true, msg: insData };
	} catch (e) {
		console.error("insertApiManyData", e)
		return(false)
	}
}