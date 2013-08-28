$(function () {
    "use strict";
    // var lastsel;
    var scr = "question01";
    $("#list2").jqGrid({
        url:'/nodb?action=ajaxquerylist&scr=' + scr + "&_datatype=array",
        datatype: "json",
        colNames: ['No', '题目', '选择答案','正确答案', '分类1', '难度', '关键字标签', '创建时间', '更新时间', '操作'], 
        colModel: [ 
                    { name: 'id', index: 'id', width: 40, align: 'center'},
                    { name: 'descr', index: 'descr', width: 110},
                    { name: 'hint', index: 'hint', width: 150}, 
                    { name: 'ans', index: 'ans', width: 35, align: 'center'},
                    { name: 'cat1', index: 'cat1', width: 80, align: 'center'},
                    //{ name: 'grade', index: 'grade', width: 38, align: 'center', hidden:true},
                    { name: 'difficulty', index: 'difficulty', width: 30, align: 'center'},
                    { name: 'tag', index: 'tag', width: 38, align: 'right', hidden:true},
                    { name: 'created_at', index: 'created_at', width: 70, align: 'center'},
                    { name: 'updated_at', index: 'updated_at', width: 70, align: 'center'},            
                    { name: 'id', index: 'id', width: 100}    
        ],
        rowNum:100,
        rowList:[100,200,300],
        pager: '#pager2',
        width: 1000, 
        height: 370,
        sortname: 'id',
        viewrecords: true,
        sortorder: "desc",
        loadtext: "请稍候...",
        multiselect: true,
        cellEdit: true, // TRUE = turns on celledit for the grid.
        cellsubmit: 'clientArray',
        prmNames: {sort:"sys__sort",order:"sys__order",rows:"sys__rows__page",page:"sys__query__page"},
        // onSelectRow: function(id){
        //     alert("444");
        //     if(id && id!==lastsel){
        //         alert("333")
        //         jQuery('#list2').jqGrid('restoreRow',lastsel);
        //         // jQuery('#list2').jqGrid('editRow',id,true);
        //         alert("333");
        //         $("#list2").jqGrid('delGridRow',id,{url: "http://192.168.2.45:8888?_act=Delete&_tbl=" + _tbl + "&_id=" + id, reloadAfterSubmit:false});
        //         lastsel=id;
        //     }
        // }   
        beforeSaveCell: function(rowid,celname,value,iRow,iCol) {
            $.ajax({
                type: "POST",
                url:'/nodb?_act=update&_tbl=' + _tbl + '&_flds='+ celname + "&_vals=" + value + "&_id=" + rowid,
                beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))},
                async: false,
                data:'json',
                success: function(data) {
                   if (data["res"]) {
                      alert(data["msg"]);
                   } 
                }
            });
        }
    });
    $("#list2").jqGrid('navGrid','#pager2',{edit:false,add:false,del:false});
       
    $("#del_btn").click(function(){
        var rowIds = $("#list2").jqGrid('getGridParam','selarrrow');
        alert(rowIds);

        if( rowIds.length != 0 && rowIds != null ) {
            if(confirm("您是否确认删除？")) {
                $.ajax({ 
                    type: "POST", 
                    url: "/nodb?action=delete&scr=" + scr + "&id=" + rowIds, 
                    // data: {
                    //     "action": "delete",
                    //     "scr":scr,
                    //     "id": rowIds
                    // },
                    beforeSend: function() {
                    }, 
                    error:function(){
                    }, 
                    success: function(data){ 
                       if(data["msg"]!=0){
                           var arr = data["msg"].split(','); 
                           $.each(arr,function(i,n){ 
                                if(arr[i]!=""){
                                    $("#list2").jqGrid('delRowData',n);  
                                } 
                           });
                            alert("已成功删除!");
                       }else{
                            alert("操作失败！");
                       } 
                    } 
                });  
            }
            // $("#list2").jqGrid('delGridRow', rowId, {url: "http://192.168.2.45:8888?_act=Delete&_tbl=" + _tbl + "&_id=" + rowId, reloadAfterSubmit:false});
        } else {
            alert("Please Select Row to delete!");
        }
    });
    $("#add_btn").click(function(){
        if(confirm("您确定要新增吗？")) {
            $.ajax({ 
                type: "GET", 
                url: "/nodb?action=add&scr=" + scr, 
                data: {
                    action: "add",
                    scr:scr,
                    "question.hint": "60111111111111",
                    "question.descr":  "成年人每分钟心跳平均约多少次？(test)",
                    "question.ans": 2,
                    "question.cat1":6,
                },
                beforeSend: function() {
                }, 
                error:function(){
                }, 
                success: function(data){ 
                   if(data["msg"]!=0){
                       var arr = data["msg"].split(','); 
                       $.each(arr,function(i,n){ 
                            if(arr[i]!=""){
                                $("#list2").jqGrid('delRowData',n);  
                            } 
                       });
                        alert("已成功删除!");
                   }else{
                        alert("操作失败！");
                   } 
                } 
            });  
        }
    });
});
