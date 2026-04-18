@section('css')
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/v/bs4/jszip-2.5.0/dt-1.10.18/b-1.5.6/b-colvis-1.5.6/b-html5-1.5.6/b-print-1.5.6/r-2.2.2/sl-1.3.0/datatables.min.css"/>
@endsection

@section('content')

    <div class="table-responsive">
        <table id="datatable" class="table table-striped display table-hover table-sm" style="width:100%">
            <tfoot>
            <tr>
                @foreach($columns as $column)
                    <th></th>
                @endforeach

            </tr>
            </tfoot>
        </table>
    </div>



@endsection

@section('js')
    <script type="text/javascript"
            src="https://cdn.datatables.net/v/bs4/jszip-2.5.0/dt-1.10.18/b-1.5.6/b-colvis-1.5.6/b-html5-1.5.6/b-print-1.5.6/r-2.2.2/sl-1.3.0/datatables.min.js"></script>


    <script>
        var data = @json( $data );

        var columns = @json( $columns );

        var moneyColumns =  @json($moneyColumns);
        var intColumns =  @json($intColumns);
        var decimalColumns =  @json($decimalColumns);
        var orderColumn = @json($orderColumn);



        $(document).ready(function() {

            var table = $('#datatable').DataTable( {
                deferRender: true,
                renderer:"bootstrap",
                processing: true,
                data:data,
                columns: columns,
                columnDefs: [
                    { render: $.fn.dataTable.render.number( ' ', '.', 2, '',' $' ), targets:moneyColumns },
                    { render: $.fn.dataTable.render.number( ' ', '.', 0 ), targets:intColumns },
                    { render: $.fn.dataTable.render.number( ' ', '.', 2 ), targets:decimalColumns },
                    { render: $.fn.dataTable.render.text(), targets: '_all'}
                ],

                order: [orderColumn, 'desc'],

                defaultContent: "",
                dom: "<'row'<'col-sm-12 col-lg-8'B><'col-sm-12 col-lg-4'f>>" +
                    "<'row'<'col-sm-12'tr>>" +
                    "<'row'<'col-sm-12 col-lg-3'l><'col-sm-12 col-lg-5'i><'col-sm-12 col-lg-4'p>>",
                buttons: [
                    {
                        extend: 'colvis',
                        className: 'btn btn-default btn-sm no-corner',
                        text: 'Colonnes',
                    },
                    {
                        extend: 'excelHtml5',
                        className: 'btn btn-default btn-sm no-corner',
                        text: 'Excel',
                        exportOptions: {
                            modifier: {
                                page: 'current'
                            }
                        },
                        createEmptyCells:true,
                        filename:'LRDC {{$model}}'
                    },
                    {
                        extend: 'excelHtml5',
                        className: 'btn btn-default btn-sm no-corner',
                        text: 'Excel (tout)',
                        createEmptyCells:true,
                        filename:'LRDC {{$model}}'
                    },
                    {
                        extend: 'print',
                        className: 'btn btn-default btn-sm no-corner',
                        text: 'Imprimer',
                        exportOptions: {
                            modifier: {
                                page: 'current'
                            }
                        }
                    },
                    {
                        extend: 'selectedSingle',
                        className: 'btn btn-default btn-sm no-corner',
                        text: 'Voir',
                        action: function ( e, dt ) {
                            var data = dt.row( { selected: true } ).data();
                            window.location.href = "/{{$model}}/" + data['id'];

                        }
                    },

                    @can( 'edit ' . (isset($permission) ? $permission : $model))
                    {
                        extend: 'selectedSingle',
                        className: 'btn btn-default btn-sm no-corner',
                        text: 'Éditer',
                        action: function ( e, dt ) {
                            var data = dt.row( { selected: true } ).data();
                            window.location.href = "/{{$model}}/" + data['id'] + "/edit";

                        }
                    }
                    @endcan
                ],
                pageLength: 25,
                lengthChange: true,
                lengthMenu: [ [15, 25, 50, 100], [15, 25, 50, 100] ],
                responsive: true,
                select: {
                    style: 'single',
                    items: 'row',
                    info: false
                },
                language: {
                    "Print":           "Imprimer",
                    "sProcessing":     "Traitement en cours...",
                    "sSearch":         "Rechercher&nbsp;:",
                    "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments",
                    "sInfo":           "Affichage de l'&eacute;l&eacute;ment _START_ &agrave; _END_. Total: _TOTAL_",
                    "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0. Total: 0",
                    "sInfoFiltered":   "(filtr&eacute; de _MAX_)",
                    "sInfoPostFix":    "",
                    "sLoadingRecords": "Chargement en cours...",
                    "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
                    "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
                    "oPaginate": {
                        "sFirst":      "Premier",
                        "sPrevious":   "Pr&eacute;c&eacute;dent",
                        "sNext":       "Suivant",
                        "sLast":       "Dernier"
                    },
                    "oAria": {
                        "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                        "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
                    },
                    "select": {
                        "rows": {
                            _: "%d lignes séléctionnées",
                            0: "Aucune ligne séléctionnée",
                            1: "1 ligne séléctionnée"
                        }
                    }
                }
            } );


            // Setup - add a text input to each footer cell
            $('#datatable tfoot  th').each( function () {
                $(this).html( '<div class="input-group">' +
                    '<div class="input-group-prepend">' +
                    '<span class="input-group-text">' +
                    '<i class="fas fa-filter"></i>' +
                    '</span>' +
                    '</div> ' +
                    '<input type="text" class="form-control form-control-sm input-sm" />' +
                    '</div>' );
            } );


            // Apply the filter
            table.columns().every( function () {
                var column = this;

                $( 'input', this.footer() ).on( 'keyup change', function () {
                    column
                        .search( this.value )
                        .draw();
                } );
            } );

        } );
    </script>
@endsection
