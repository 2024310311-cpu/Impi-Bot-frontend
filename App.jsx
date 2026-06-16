import { useState } from 'react';
import axios from 'axios';

// IMPORTANTE PARA DEPLOYMENT: 
// Esta es la URL de tu robot en la nube (Render)
const API_URL = "https://impi-bot.onrender.com";

function App() {
  const [marca, setMarca] = useState('');
  const [clase, setClase] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState({ peligro_alto: [], peligro_medio: [], peligro_bajo: [] });
  const [seleccionados, setSeleccionados] = useState([]);
  const [orden, setOrden] = useState('desc');
  
  const [descargando, setDescargando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [linksDescarga, setLinksDescarga] = useState({});
  const [pdfPreview, setPdfPreview] = useState(null); 

  const buscarMarca = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResultados({ peligro_alto: [], peligro_medio: [], peligro_bajo: [] });
    setSeleccionados([]);
    setLinksDescarga({}); 

    try {
      const response = await axios.post(`${API_URL}/api/buscar`, {
        denominacion: marca,
        clase: clase
      });
      // Asignar un ID único a cada resultado para poder seleccionarlos de forma independiente
      const agregarId = (arr, prefix) => (arr || []).map((item, i) => ({ ...item, _id: `${prefix}-${i}` }));
      setResultados({
        peligro_alto: agregarId(response.data.resultados.peligro_alto, 'alto'),
        peligro_medio: agregarId(response.data.resultados.peligro_medio, 'medio'),
        peligro_bajo: agregarId(response.data.resultados.peligro_bajo, 'bajo')
      });
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("Hubo un error al conectar con el servidor IMPI.");
    } finally {
      setLoading(false);
    }
  };

  const descargarArchivos = async () => {
    setDescargando(true);
    try {
      const seleccionadosObjetos = resultadosOrdenados.filter(res => seleccionados.includes(res._id));
      const expedientesUnicos = [...new Set(seleccionadosObjetos.map(res => res.expediente).filter(Boolean))];
      const res = await axios.post(`${API_URL}/api/descargar`, {
        expedientes: expedientesUnicos
      });
      
      const nuevosLinks = { ...linksDescarga };
      res.data.detalles.forEach(detalle => {
        if (detalle.url) {
          nuevosLinks[detalle.expediente] = detalle.url;
        }
      });
      setLinksDescarga(nuevosLinks);
      
    } catch (error) {
      alert("Hubo un error al intentar descargar los archivos oficiales.");
    } finally {
      setDescargando(false);
    }
  };

  const resultadosUnidos = [
    ...(resultados.peligro_alto || []), 
    ...(resultados.peligro_medio || []), 
    ...(resultados.peligro_bajo || [])
  ];
  
  const resultadosOrdenados = resultadosUnidos.sort((a, b) => {
    return orden === 'desc' ? b.similitud - a.similitud : a.similitud - b.similitud;
  });

  const isAllSelected = resultadosOrdenados.length > 0 && seleccionados.length === resultadosOrdenados.length;

  const exportarArchivoExcel = async () => {
    setExportando(true);
    try {
      const response = await axios.post(`${API_URL}/api/exportar-excel`, {
        resultados: resultadosOrdenados
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_IMPI_${marca}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      alert("Hubo un error al generar el archivo Excel.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 p-6 relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="bg-blue-900 text-white p-6 rounded-t-lg shadow-md flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Monitor de Marcas IMPI</h1>
            <p className="text-blue-200 text-sm mt-1">Análisis de riesgo fonético automatizado</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-b-lg shadow-md mb-6">
          <form onSubmit={buscarMarca} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Denominación (Marca)</label>
              <input 
                type="text" 
                required
                className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej. eValora"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Clase</label>
              <input 
                type="number" 
                required
                className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej. 41"
                value={clase}
                onChange={(e) => setClase(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || descargando}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Analizando...' : 'Buscar Riesgos'}
            </button>
          </form>
        </div>

        {(!loading && resultadosOrdenados.length > 0) && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
              <span className="font-bold text-blue-900">
                Total encontrados: {resultadosOrdenados.length}
              </span>
              
              <div className="flex gap-3">
                <button 
                  disabled={exportando}
                  className="py-2 px-4 rounded font-bold text-gray-700 bg-white border hover:bg-gray-50 transition-colors flex items-center shadow-sm"
                  onClick={exportarArchivoExcel}
                >
                  {exportando ? 'Generando Excel...' : 'Exportar a Excel Oficial'}
                </button>
                <button 
                  disabled={seleccionados.length === 0 || descargando}
                  className={`py-2 px-4 rounded font-bold text-white transition-colors shadow-sm ${
                    seleccionados.length === 0 || descargando 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  onClick={descargarArchivos}
                >
                  {descargando ? 'Extrayendo PDFs...' : 'Extraer Expedientes Oficiales'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-max">
                <thead>
                  <tr className="bg-gray-200 text-gray-700 text-xs uppercase tracking-wider">
                    <th className="p-3 w-10 text-center border-b">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 cursor-pointer"
                        title="Seleccionar Todos"
                        checked={isAllSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSeleccionados(resultadosOrdenados.map(res => res._id));
                          } else {
                            setSeleccionados([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3 w-20 text-center border-b">LOGO</th>
                    <th className="p-3 max-w-xs border-b">Titular</th>
                    <th className="p-3 w-24 text-center border-b">Expediente</th>
                    <th className="p-3 w-24 text-center border-b">Registro</th>
                    <th className="p-3 border-b">Denominación</th>
                    <th 
                      className="p-3 w-24 text-center cursor-pointer hover:bg-gray-300 transition-colors select-none border-b"
                      onClick={() => setOrden(orden === 'desc' ? 'asc' : 'desc')}
                    >
                      Similitud {orden === 'desc' ? '↓' : '↑'}
                    </th>
                    <th className="p-3 w-20 text-center border-b">Riesgo</th>
                    <th className="p-3 w-24 text-center border-b">Documento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resultadosOrdenados.map((res, idx) => {
                    let colorFila = "hover:bg-gray-50";
                    let colorInsignia = "bg-gray-100 text-gray-800 border-gray-200";
                    let textoRiesgo = "BAJO";

                    if (res.similitud >= 80) {
                      colorFila = "bg-red-50 hover:bg-red-100";
                      colorInsignia = "bg-red-100 text-red-800 border-red-200";
                      textoRiesgo = "ALTO";
                    } else if (res.similitud >= 60) {
                      colorFila = "hover:bg-yellow-50";
                      colorInsignia = "bg-yellow-100 text-yellow-800 border-yellow-200";
                      textoRiesgo = "MEDIO";
                    }

                    return (
                      <tr key={`${res.expediente}-${idx}`} className={`${colorFila} transition-colors`}>
                        <td className="p-3 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 cursor-pointer"
                            checked={seleccionados.includes(res._id)}
                            onChange={() => {
                              setSeleccionados(prev => {
                                if (prev.includes(res._id)) {
                                  return prev.filter(item => item !== res._id);
                                } else {
                                  return [...prev, res._id];
                                }
                              });
                            }}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center h-12 w-16 relative mx-auto rounded overflow-hidden">
                            <span className="text-gray-400 text-xs font-bold absolute z-0">N/A</span>
                            {res.logo && (
                              <img 
                                src={res.logo} 
                                alt="Logotipo" 
                                className="h-full w-full object-contain relative z-10 bg-transparent"
                                referrerPolicy="no-referrer"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-xs text-gray-700 max-w-xs truncate" title={res.titular}>{res.titular || 'N/A'}</td>
                        <td className="p-3 text-center font-mono text-gray-600">{res.expediente}</td>
                        <td className="p-3 text-center font-mono text-gray-600">{res.registro || 'N/A'}</td>
                        <td className="p-3 font-bold text-gray-900">{res.denominacion}</td>
                        <td className="p-3 text-center font-bold text-gray-700">{res.similitud}%</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${colorInsignia}`}>
                            {textoRiesgo}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {linksDescarga[res.expediente] ? (
                            <button 
                              onClick={() => setPdfPreview(linksDescarga[res.expediente])}
                              className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-1 px-3 rounded text-xs transition-colors shadow-sm"
                            >
                              VER PREVIA
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {pdfPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
              <h3 className="text-lg font-bold text-gray-800">Vista Previa del Expediente</h3>
              <button 
                onClick={() => setPdfPreview(null)}
                className="text-gray-500 hover:text-red-600 font-bold text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex-grow bg-gray-200 p-2">
              <iframe 
                src={pdfPreview} 
                className="w-full h-full border-0 rounded bg-white shadow-inner"
                title="Vista previa PDF"
              ></iframe>
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button 
                onClick={() => setPdfPreview(null)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded transition-colors"
              >
                Cerrar
              </button>
              <a 
                href={pdfPreview} 
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition-colors flex items-center gap-2"
              >
                Descargar Original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;