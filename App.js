import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './lib/supabase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function fechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

function nombreGrado(grado) {
  if (!grado) return 'Sin grado';
  return grado.nombre || `Grado ${grado.numero}`;
}

function nombreCompleto(persona) {
  if (!persona) return '';
  return `${persona.nombres || ''} ${persona.apellidos || ''}`.trim();
}

function validarCorreo(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function validarFecha(fecha) {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

function validarHora(hora) {
  return /^\d{2}:\d{2}$/.test(hora);
}

function obtenerDesempenoPromedio(promedio) {
  if (promedio === null) return 'Sin datos';
  if (promedio >= 4.6 && promedio <= 5.0) return 'Desempeño Superior';
  if (promedio >= 4.0 && promedio <= 4.5) return 'Desempeño Alto';
  if (promedio >= 3.0 && promedio <= 3.9) return 'Desempeño Básico';
  if (promedio >= 1.0 && promedio <= 2.9) return 'Desempeño Bajo';
  return 'Sin datos';
}

function calcularResumenAcademico(notasAcademicas, asistenciasAcademicas, actividadesAcademicas) {
  const notasValidas = (notasAcademicas || [])
    .map((nota) => Number(nota.nota))
    .filter((nota) => !Number.isNaN(nota));

  const cantidadNotas = notasValidas.length;

  const promedio =
    cantidadNotas > 0
      ? notasValidas.reduce((suma, nota) => suma + nota, 0) / cantidadNotas
      : null;

  const promedioTexto = promedio !== null ? promedio.toFixed(1) : 'Sin notas';
  const desempenoGeneral = obtenerDesempenoPromedio(promedio);

  const totalAsistencias = (asistenciasAcademicas || []).length;

  const totalAusencias = (asistenciasAcademicas || []).filter(
    (asistencia) => String(asistencia.estado).toLowerCase() === 'ausente'
  ).length;

  const totalPresentes = (asistenciasAcademicas || []).filter(
    (asistencia) => String(asistencia.estado).toLowerCase() === 'presente'
  ).length;

  const porcentajeAsistencia =
    totalAsistencias > 0 ? ((totalPresentes / totalAsistencias) * 100).toFixed(1) : 'Sin datos';

  const totalActividades = (actividadesAcademicas || []).length;

  const actividadesPendientes = (actividadesAcademicas || []).filter(
    (actividad) => String(actividad.estado).toLowerCase() === 'pendiente'
  ).length;

  let mensaje = 'Todavía no hay suficiente información académica para generar un análisis.';

  if (promedio !== null) {
    if (promedio < 3.0) {
      mensaje =
        'El estudiante presenta bajo rendimiento académico. Es importante revisar las notas, actividades pendientes y comunicarse con el profesor.';
    } else if (promedio >= 3.0 && promedio < 4.0) {
      mensaje =
        'El estudiante tiene un rendimiento básico. Puede mejorar si refuerza las actividades y mantiene buena asistencia.';
    } else if (promedio >= 4.0 && promedio < 4.6) {
      mensaje =
        'El estudiante tiene buen rendimiento académico. Se recomienda continuar con el acompañamiento.';
    } else {
      mensaje =
        'El estudiante presenta un rendimiento académico superior. Es importante seguir motivando su buen desempeño.';
    }
  }

  if (totalAusencias > 0) {
    mensaje += ` Además, registra ${totalAusencias} ausencia(s), por lo que se recomienda revisar la asistencia.`;
  }

  if (actividadesPendientes > 0) {
    mensaje += ` También tiene ${actividadesPendientes} actividad(es) pendiente(s).`;
  }

  return {
    promedioTexto,
    desempenoGeneral,
    cantidadNotas,
    totalAsistencias,
    totalPresentes,
    totalAusencias,
    porcentajeAsistencia,
    totalActividades,
    actividadesPendientes,
    mensaje,
  };
}

function BotonPrincipal({ titulo, onPress }) {
  return (
    <TouchableOpacity style={styles.botonPrincipal} onPress={onPress}>
      <Text style={styles.textoBotonPrincipal}>{titulo}</Text>
    </TouchableOpacity>
  );
}

function BotonSecundario({ titulo, onPress }) {
  return (
    <TouchableOpacity style={styles.botonSecundario} onPress={onPress}>
      <Text style={styles.textoBotonSecundario}>{titulo}</Text>
    </TouchableOpacity>
  );
}

function BotonPeligro({ titulo, onPress }) {
  return (
    <TouchableOpacity style={styles.botonPeligro} onPress={onPress}>
      <Text style={styles.textoBotonPeligro}>{titulo}</Text>
    </TouchableOpacity>
  );
}

function Campo({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
}) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.inputGrande]}
      placeholder={placeholder}
      placeholderTextColor="#8A8A8A"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize="none"
      autoCorrect={false}
      multiline={multiline}
    />
  );
}

function Pantalla({ children, scroll = true, centrado = false }) {
  if (centrado) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.centro}>{children}</View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={styles.flex}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ResumenAcademico({ notasAcademicas, asistenciasAcademicas, actividadesAcademicas }) {
  const resumen = calcularResumenAcademico(
    notasAcademicas,
    asistenciasAcademicas,
    actividadesAcademicas
  );

  return (
    <View style={styles.tarjeta}>
      <Text style={styles.tituloTarjeta}>Resumen académico</Text>
      <Text style={styles.textoDetalle}>Promedio general: {resumen.promedioTexto}</Text>
      <Text style={styles.textoDetalle}>Desempeño general: {resumen.desempenoGeneral}</Text>
      <Text style={styles.textoDetalle}>Notas registradas: {resumen.cantidadNotas}</Text>
      <Text style={styles.textoDetalle}>Asistencias registradas: {resumen.totalAsistencias}</Text>
      <Text style={styles.textoDetalle}>Presentes: {resumen.totalPresentes}</Text>
      <Text style={styles.textoDetalle}>Ausencias: {resumen.totalAusencias}</Text>
      <Text style={styles.textoDetalle}>
        Porcentaje de asistencia: {resumen.porcentajeAsistencia}%
      </Text>
      <Text style={styles.textoDetalle}>Actividades registradas: {resumen.totalActividades}</Text>
      <Text style={styles.textoDetalle}>
        Actividades pendientes: {resumen.actividadesPendientes}
      </Text>
      <Text style={styles.estadoTexto}>Mensaje:</Text>
      <Text style={styles.textoTarjeta}>{resumen.mensaje}</Text>
    </View>
  );
}

export default function App() {
  const [pantalla, setPantalla] = useState('bienvenida');
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState('profesor');

  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);

  const [perfilNombres, setPerfilNombres] = useState('');
  const [perfilApellidos, setPerfilApellidos] = useState('');
  const [perfilTelefono, setPerfilTelefono] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');

  const [correoRecuperacion, setCorreoRecuperacion] = useState('');

  const [grados, setGrados] = useState([]);
  const [gradoSeleccionado, setGradoSeleccionado] = useState(null);
  const [gradoNumero, setGradoNumero] = useState('');

  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionadaEditar, setMateriaSeleccionadaEditar] = useState(null);
  const [materiaNombre, setMateriaNombre] = useState('');
  const [materiaDescripcion, setMateriaDescripcion] = useState('');

  const [estudiantes, setEstudiantes] = useState([]);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [estudianteNombres, setEstudianteNombres] = useState('');
  const [estudianteApellidos, setEstudianteApellidos] = useState('');
  const [estudianteDireccion, setEstudianteDireccion] = useState('');
  const [estudianteFechaNacimiento, setEstudianteFechaNacimiento] = useState('');
  const [estudianteIdentificacion, setEstudianteIdentificacion] = useState('');

  const [estudianteProfesorSeleccionado, setEstudianteProfesorSeleccionado] = useState(null);
  const [estudiantePadreSeleccionado, setEstudiantePadreSeleccionado] = useState(null);
  const [estudiantesVinculados, setEstudiantesVinculados] = useState([]);
  const [identificacionVincular, setIdentificacionVincular] = useState('');

  const [notasAcademicas, setNotasAcademicas] = useState([]);
  const [asistenciasAcademicas, setAsistenciasAcademicas] = useState([]);
  const [actividadesAcademicas, setActividadesAcademicas] = useState([]);

  const [notaSeleccionadaEditar, setNotaSeleccionadaEditar] = useState(null);
  const [materiaNotaId, setMateriaNotaId] = useState('');
  const [notaTitulo, setNotaTitulo] = useState('');
  const [notaDescripcion, setNotaDescripcion] = useState('');
  const [notaPeriodo, setNotaPeriodo] = useState('1');
  const [notaValor, setNotaValor] = useState('');

  const [asistenciaSeleccionadaEditar, setAsistenciaSeleccionadaEditar] = useState(null);
  const [materiaAsistenciaId, setMateriaAsistenciaId] = useState('');
  const [asistenciaFecha, setAsistenciaFecha] = useState(fechaHoy());
  const [asistenciaEstado, setAsistenciaEstado] = useState('presente');
  const [asistenciaObservacion, setAsistenciaObservacion] = useState('');

  const [actividadSeleccionadaEditar, setActividadSeleccionadaEditar] = useState(null);
  const [actividadTipo, setActividadTipo] = useState('tarea');
  const [actividadTitulo, setActividadTitulo] = useState('');
  const [actividadDescripcion, setActividadDescripcion] = useState('');
  const [actividadFechaEntrega, setActividadFechaEntrega] = useState('');
  const [actividadMateriaId, setActividadMateriaId] = useState('');

  const [notificaciones, setNotificaciones] = useState([]);

  const [horariosAtencion, setHorariosAtencion] = useState([]);
  const [diaSemana, setDiaSemana] = useState('1');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');

  const [conversacionesChat, setConversacionesChat] = useState([]);
  const [conversacionSeleccionada, setConversacionSeleccionada] = useState(null);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [mensajeTexto, setMensajeTexto] = useState('');

  useEffect(() => {
    revisarSesion();
  }, []);

  async function registrarTokenPush(userId, mostrarAlerta = true) {
    try {
      if (!userId) {
        Alert.alert('Error', 'No se encontró el usuario para guardar el token.');
        return;
      }

      if (!Device.isDevice) {
        Alert.alert(
          'Celular físico requerido',
          'Las notificaciones push deben probarse en un celular real.'
        );
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Aula360',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#22C356',
          sound: 'default',
        });
      }

      const { status: estadoActual } = await Notifications.getPermissionsAsync();
      let estadoFinal = estadoActual;

      if (estadoActual !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        estadoFinal = status;
      }

      if (estadoFinal !== 'granted') {
        Alert.alert(
          'Permiso rechazado',
          'Debes permitir las notificaciones para que Aula360 pueda avisarte en segundo plano.'
        );
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '4e9d2302-8da7-490e-87e7-b72c4e442557',
      });

      const token = tokenData.data;

      const { data, error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            usuario_id: userId,
            token: token,
            plataforma: Platform.OS,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'usuario_id',
          }
        )
        .select();

      if (error) {
        Alert.alert('Error guardando token', error.message);
        return;
      }

      console.log('Token push guardado:', data);

      if (mostrarAlerta) {
        Alert.alert(
          'Notificaciones activadas',
          'Este celular ya quedó registrado para recibir notificaciones de Aula360.'
        );
      }
    } catch (error) {
      Alert.alert('Error en notificaciones', error.message);
    }
  }

  async function enviarPush(token, titulo, mensaje, dataExtra = {}) {
    try {
      if (!token) return;

      const respuesta = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          sound: 'default',
          title: titulo,
          body: mensaje,
          priority: 'high',
          channelId: 'default',
          data: dataExtra,
        }),
      });

      const resultado = await respuesta.json();
      console.log('Resultado push:', resultado);
    } catch (error) {
      console.log('Error enviando push:', error.message);
    }
  }

  async function enviarPushAUsuarios(idsUsuarios, titulo, mensaje, dataExtra = {}) {
    try {
      if (!idsUsuarios || idsUsuarios.length === 0) return;

      const { data: tokens, error } = await supabase
        .from('push_tokens')
        .select('token')
        .in('usuario_id', idsUsuarios);

      if (error) {
        console.log('Error buscando tokens:', error.message);
        return;
      }

      if (!tokens || tokens.length === 0) {
        console.log('No hay tokens push guardados para estos usuarios.');
        return;
      }

      await Promise.all(
        tokens.map((item) => enviarPush(item.token, titulo, mensaje, dataExtra))
      );
    } catch (error) {
      console.log('Error enviando push a usuarios:', error.message);
    }
  }

  async function revisarSesion() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log('Error revisando sesión:', error.message);
      return;
    }

    if (data.session) {
      setUsuario(data.session.user);
      await cargarPerfil(data.session.user.id);
    }
  }

  async function cargarPerfil(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      Alert.alert('Error', 'No se pudo cargar el perfil del usuario.');
      return;
    }

    if (!data) {
      Alert.alert('Perfil no encontrado', 'Tu usuario existe, pero todavía no tiene perfil.');
      await supabase.auth.signOut();
      setUsuario(null);
      setPerfil(null);
      setPantalla('bienvenida');
      return;
    }

    setPerfil(data);

    await registrarTokenPush(userId, false);

    if (data.rol === 'profesor') {
      await cargarGrados(userId);
      await cargarNotificaciones(userId);
      setPantalla('panelProfesor');
    } else {
      await cargarEstudiantesPadre(userId);
      await cargarNotificaciones(userId);
      setPantalla('panelPadre');
    }
  }

  function confirmarEliminar(titulo, mensaje, accion) {
    Alert.alert(titulo, mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: accion },
    ]);
  }

  async function enviarRecuperacionPassword() {
    if (!correoRecuperacion.trim()) {
      Alert.alert('Campo obligatorio', 'Escribe tu correo electrónico.');
      return;
    }

    if (!validarCorreo(correoRecuperacion.trim())) {
      Alert.alert('Correo inválido', 'Escribe un correo válido.');
      return;
    }

    setCargando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(correoRecuperacion.trim());

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert(
      'Correo enviado',
      'Revisa tu correo electrónico. Supabase enviará las instrucciones para recuperar tu contraseña.'
    );

    setCorreoRecuperacion('');
    setPantalla('login');
  }

  function abrirPerfilUsuario() {
    setPerfilNombres(perfil?.nombres || '');
    setPerfilApellidos(perfil?.apellidos || '');
    setPerfilTelefono(perfil?.telefono || '');
    setNuevaPassword('');
    setPantalla('perfilUsuario');
  }

  async function guardarCambiosPerfil() {
    if (!usuario?.id) {
      Alert.alert('Error', 'No se encontró el usuario.');
      return;
    }

    if (!perfilNombres.trim() || !perfilApellidos.trim()) {
      Alert.alert('Campos obligatorios', 'Debes escribir nombres y apellidos.');
      return;
    }

    setCargando(true);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        nombres: perfilNombres.trim(),
        apellidos: perfilApellidos.trim(),
        telefono: perfilTelefono.trim() || null,
      })
      .eq('id', usuario.id)
      .select('*')
      .single();

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setPerfil(data);
    Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.');

    if (data.rol === 'profesor') {
      setPantalla('panelProfesor');
    } else {
      setPantalla('panelPadre');
    }
  }

  async function cambiarPasswordDesdeConfiguracion() {
    if (!nuevaPassword.trim()) {
      Alert.alert('Campo obligatorio', 'Escribe una nueva contraseña.');
      return;
    }

    if (nuevaPassword.trim().length < 6) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    setCargando(true);

    const { error } = await supabase.auth.updateUser({
      password: nuevaPassword.trim(),
    });

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Contraseña actualizada', 'Tu contraseña fue cambiada correctamente.');
    setNuevaPassword('');
  }

  async function registrarUsuario() {
    if (!nombres.trim() || !apellidos.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Campos incompletos', 'Por favor llena nombres, apellidos, correo y contraseña.');
      return;
    }

    if (!validarCorreo(email.trim())) {
      Alert.alert('Correo inválido', 'Escribe un correo electrónico válido.');
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    setCargando(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          rol,
          telefono: telefono.trim() || '',
        },
      },
    });

    setCargando(false);

    if (error) {
      Alert.alert('Error al registrar', error.message);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      Alert.alert('Revisa tu correo', 'La cuenta fue creada, pero puede requerir confirmación.');
      setPantalla('login');
      return;
    }

    if (!data.session) {
      Alert.alert('Cuenta creada', 'Ahora inicia sesión con tu correo y contraseña.');
      limpiarFormularioRegistro();
      setPantalla('login');
      return;
    }

    Alert.alert('Registro exitoso', 'Tu cuenta fue creada correctamente.');
    setUsuario(data.user);

    setTimeout(async () => {
      await cargarPerfil(userId);
      limpiarFormularioRegistro();
    }, 1000);
  }

  async function iniciarSesion() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos incompletos', 'Ingresa correo y contraseña.');
      return;
    }

    if (!validarCorreo(email.trim())) {
      Alert.alert('Correo inválido', 'Escribe un correo electrónico válido.');
      return;
    }

    setCargando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    setCargando(false);

    if (error) {
      Alert.alert('Error al iniciar sesión', error.message);
      return;
    }

    setUsuario(data.user);
    await cargarPerfil(data.user.id);
  }

  async function cargarGrados(profesorId = usuario?.id) {
    if (!profesorId) return;

    setCargandoDatos(true);

    const { data, error } = await supabase
      .from('grados')
      .select('*')
      .eq('profesor_id', profesorId)
      .order('numero', { ascending: true });

    setCargandoDatos(false);

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los grados.');
      return;
    }

    setGrados(data || []);
  }

  async function guardarGrado() {
    if (!usuario?.id) {
      Alert.alert('Error', 'No se encontró el usuario profesor.');
      return;
    }

    const numero = parseInt(gradoNumero, 10);

    if (!numero || numero < 1 || numero > 11) {
      Alert.alert('Dato inválido', 'El grado debe estar entre 1 y 11.');
      return;
    }

    setCargando(true);

    const { error } = await supabase.from('grados').insert({
      profesor_id: usuario.id,
      numero,
    });

    setCargando(false);

    if (error) {
      if (error.message.includes('duplicate')) {
        Alert.alert('Grado repetido', 'Este grado ya fue creado por el profesor.');
      } else {
        Alert.alert('Error', error.message);
      }
      return;
    }

    Alert.alert('Grado creado', `El grado ${numero} fue creado correctamente.`);
    setGradoNumero('');
    await cargarGrados(usuario.id);
    setPantalla('panelProfesor');
  }

  async function eliminarGrado(grado) {
    if (!grado?.id) return;

    const { data: materiasGrado } = await supabase
      .from('materias')
      .select('id')
      .eq('grado_id', grado.id);

    const { data: estudiantesGrado } = await supabase
      .from('estudiantes')
      .select('id')
      .eq('grado_id', grado.id);

    if ((materiasGrado || []).length > 0 || (estudiantesGrado || []).length > 0) {
      Alert.alert(
        'No se puede eliminar',
        'Para eliminar este grado primero debes eliminar sus materias y estudiantes.'
      );
      return;
    }

    setCargando(true);

    const { error } = await supabase.from('grados').delete().eq('id', grado.id);

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Grado eliminado', 'El grado fue eliminado correctamente.');
    await cargarGrados(usuario?.id);
  }

  async function seleccionarGrado(grado) {
    setGradoSeleccionado(grado);
    setBusquedaEstudiante('');
    await cargarMaterias(grado.id);
    await cargarEstudiantes(grado.id);
    setPantalla('detalleGrado');
  }

  async function cargarMaterias(gradoId = gradoSeleccionado?.id) {
    if (!gradoId || !usuario?.id) return;

    setCargandoDatos(true);

    const { data, error } = await supabase
      .from('materias')
      .select('*')
      .eq('grado_id', gradoId)
      .eq('profesor_id', usuario.id)
      .order('nombre', { ascending: true });

    setCargandoDatos(false);

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar las materias.');
      return;
    }

    setMaterias(data || []);
  }

  async function guardarMateria() {
    if (!usuario?.id) {
      Alert.alert('Error', 'No se encontró el usuario profesor.');
      return;
    }

    if (!gradoSeleccionado?.id) {
      Alert.alert('Error', 'No hay un grado seleccionado.');
      return;
    }

    if (!materiaNombre.trim()) {
      Alert.alert('Campo obligatorio', 'Escribe el nombre de la materia.');
      return;
    }

    setCargando(true);

    const { error } = await supabase.from('materias').insert({
      profesor_id: usuario.id,
      grado_id: gradoSeleccionado.id,
      nombre: materiaNombre.trim(),
      descripcion: materiaDescripcion.trim() || null,
    });

    setCargando(false);

    if (error) {
      if (error.message.includes('duplicate')) {
        Alert.alert('Materia repetida', 'Esta materia ya existe en este grado.');
      } else {
        Alert.alert('Error', error.message);
      }
      return;
    }

    Alert.alert('Materia creada', 'La materia fue creada correctamente.');
    setMateriaNombre('');
    setMateriaDescripcion('');
    await cargarMaterias(gradoSeleccionado.id);
    setPantalla('detalleGrado');
  }

  function seleccionarMateriaEditar(materia) {
    setMateriaSeleccionadaEditar(materia);
    setMateriaNombre(materia.nombre || '');
    setMateriaDescripcion(materia.descripcion || '');
    setPantalla('editarMateria');
  }

  async function guardarCambiosMateria() {
    if (!materiaSeleccionadaEditar?.id) {
      Alert.alert('Error', 'No se encontró la materia.');
      return;
    }

    if (!materiaNombre.trim()) {
      Alert.alert('Campo obligatorio', 'Escribe el nombre de la materia.');
      return;
    }

    setCargando(true);

    const { error } = await supabase
      .from('materias')
      .update({
        nombre: materiaNombre.trim(),
        descripcion: materiaDescripcion.trim() || null,
      })
      .eq('id', materiaSeleccionadaEditar.id);

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Materia actualizada', 'Los cambios se guardaron correctamente.');
    setMateriaSeleccionadaEditar(null);
    setMateriaNombre('');
    setMateriaDescripcion('');
    await cargarMaterias(gradoSeleccionado?.id);
    setPantalla('detalleGrado');
  }

  async function eliminarMateria(materia) {
    if (!materia?.id) return;

    setCargando(true);

    const { error } = await supabase.from('materias').delete().eq('id', materia.id);

    setCargando(false);

    if (error) {
      Alert.alert(
        'No se pudo eliminar',
        'Puede que esta materia tenga notas, asistencias o actividades asociadas.'
      );
      return;
    }

    Alert.alert('Materia eliminada', 'La materia fue eliminada correctamente.');
    await cargarMaterias(gradoSeleccionado?.id);
  }

  async function cargarEstudiantes(gradoId = gradoSeleccionado?.id) {
    if (!gradoId || !usuario?.id) return;

    setCargandoDatos(true);

    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('grado_id', gradoId)
      .eq('profesor_id', usuario.id)
      .order('apellidos', { ascending: true });

    setCargandoDatos(false);

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los estudiantes.');
      return;
    }

    setEstudiantes(data || []);
  }

  async function guardarEstudiante() {
    if (!usuario?.id) {
      Alert.alert('Error', 'No se encontró el usuario profesor.');
      return;
    }

    if (!gradoSeleccionado?.id) {
      Alert.alert('Error', 'No hay un grado seleccionado.');
      return;
    }

    if (!estudianteNombres.trim() || !estudianteApellidos.trim() || !estudianteIdentificacion.trim()) {
      Alert.alert('Campos obligatorios', 'Debes llenar nombres, apellidos e identificación.');
      return;
    }

    if (estudianteFechaNacimiento.trim() && !validarFecha(estudianteFechaNacimiento.trim())) {
      Alert.alert('Fecha inválida', 'La fecha debe escribirse con este formato: 2010-05-20');
      return;
    }

    setCargando(true);

    const { error } = await supabase.from('estudiantes').insert({
      profesor_id: usuario.id,
      grado_id: gradoSeleccionado.id,
      nombres: estudianteNombres.trim(),
      apellidos: estudianteApellidos.trim(),
      direccion: estudianteDireccion.trim() || null,
      fecha_nacimiento: estudianteFechaNacimiento.trim() || null,
      identificacion: estudianteIdentificacion.trim(),
    });

    setCargando(false);

    if (error) {
      if (error.message.includes('duplicate')) {
        Alert.alert('Identificación repetida', 'Ya existe un estudiante con esta identificación.');
      } else {
        Alert.alert('Error', error.message);
      }
      return;
    }

    Alert.alert('Estudiante registrado', 'El estudiante fue registrado correctamente.');
    limpiarFormularioEstudiante();
    await cargarEstudiantes(gradoSeleccionado.id);
    setPantalla('detalleGrado');
  }

  async function seleccionarEstudianteProfesor(estudiante) {
    setEstudianteProfesorSeleccionado(estudiante);
    await cargarRegistrosAcademicos(estudiante.id, estudiante);
    setPantalla('detalleEstudianteProfesor');
  }

  function abrirEditarEstudiante() {
    if (!estudianteProfesorSeleccionado) {
      Alert.alert('Error', 'No hay estudiante seleccionado.');
      return;
    }

    setEstudianteNombres(estudianteProfesorSeleccionado.nombres || '');
    setEstudianteApellidos(estudianteProfesorSeleccionado.apellidos || '');
    setEstudianteDireccion(estudianteProfesorSeleccionado.direccion || '');
    setEstudianteFechaNacimiento(estudianteProfesorSeleccionado.fecha_nacimiento || '');
    setEstudianteIdentificacion(estudianteProfesorSeleccionado.identificacion || '');
    setPantalla('editarEstudiante');
  }

  async function guardarCambiosEstudiante() {
    if (!estudianteProfesorSeleccionado?.id) {
      Alert.alert('Error', 'No se encontró el estudiante.');
      return;
    }

    if (!estudianteNombres.trim() || !estudianteApellidos.trim() || !estudianteIdentificacion.trim()) {
      Alert.alert('Campos obligatorios', 'Debes llenar nombres, apellidos e identificación.');
      return;
    }

    if (estudianteFechaNacimiento.trim() && !validarFecha(estudianteFechaNacimiento.trim())) {
      Alert.alert('Fecha inválida', 'La fecha debe escribirse con este formato: 2010-05-20');
      return;
    }

    setCargando(true);

    const { data, error } = await supabase
      .from('estudiantes')
      .update({
        nombres: estudianteNombres.trim(),
        apellidos: estudianteApellidos.trim(),
        direccion: estudianteDireccion.trim() || null,
        fecha_nacimiento: estudianteFechaNacimiento.trim() || null,
        identificacion: estudianteIdentificacion.trim(),
      })
      .eq('id', estudianteProfesorSeleccionado.id)
      .select('*')
      .single();

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Estudiante actualizado', 'Los cambios se guardaron correctamente.');
    setEstudianteProfesorSeleccionado(data);
    limpiarFormularioEstudiante();
    await cargarEstudiantes(gradoSeleccionado?.id);
    await cargarRegistrosAcademicos(data.id, data);
    setPantalla('detalleEstudianteProfesor');
  }

  async function eliminarEstudiante(estudiante) {
    if (!estudiante?.id) return;

    setCargando(true);

    const { error } = await supabase.from('estudiantes').delete().eq('id', estudiante.id);

    setCargando(false);

    if (error) {
      Alert.alert(
        'No se pudo eliminar',
        'Puede que este estudiante tenga notas, asistencias, actividades o vínculos asociados.'
      );
      return;
    }

    Alert.alert('Estudiante eliminado', 'El estudiante fue eliminado correctamente.');
    setEstudianteProfesorSeleccionado(null);
    limpiarFormularioEstudiante();
    await cargarEstudiantes(gradoSeleccionado?.id);
    setPantalla('detalleGrado');
  }

  async function agregarNombreMateria(registros) {
    if (!registros || registros.length === 0) return [];

    const idsMaterias = [...new Set(registros.map((r) => r.materia_id).filter(Boolean))];

    if (idsMaterias.length === 0) {
      return registros.map((r) => ({ ...r, materia_nombre: 'Sin materia' }));
    }

    const { data: listaMaterias } = await supabase
      .from('materias')
      .select('id,nombre')
      .in('id', idsMaterias);

    return registros.map((registro) => {
      const materia = (listaMaterias || []).find((m) => m.id === registro.materia_id);

      return {
        ...registro,
        materia_nombre: materia ? materia.nombre : 'Sin materia',
      };
    });
  }

  async function cargarRegistrosAcademicos(estudianteId, estudianteBase = null) {
    if (!estudianteId) return;

    setCargandoDatos(true);

    const { data: notas, error: errorNotas } = await supabase
      .from('notas')
      .select('*')
      .eq('estudiante_id', estudianteId)
      .order('fecha_registro', { ascending: false });

    if (errorNotas) {
      setCargandoDatos(false);
      Alert.alert('Error', 'No se pudieron cargar las notas.');
      return;
    }

    const { data: asistencias, error: errorAsistencias } = await supabase
      .from('asistencias')
      .select('*')
      .eq('estudiante_id', estudianteId)
      .order('fecha', { ascending: false });

    if (errorAsistencias) {
      setCargandoDatos(false);
      Alert.alert('Error', 'No se pudieron cargar las asistencias.');
      return;
    }

    const estudianteActual =
      estudianteBase || estudianteProfesorSeleccionado || estudiantePadreSeleccionado;

    let consultaActividades = supabase
      .from('actividades')
      .select('*')
      .or(`estudiante_id.eq.${estudianteId},estudiante_id.is.null`)
      .order('created_at', { ascending: false });

    if (estudianteActual?.grado_id) {
      consultaActividades = consultaActividades.eq('grado_id', estudianteActual.grado_id);
    }

    const { data: actividades, error: errorActividades } = await consultaActividades;

    if (errorActividades) {
      setCargandoDatos(false);
      Alert.alert('Error', 'No se pudieron cargar las actividades.');
      return;
    }

    const notasConMateria = await agregarNombreMateria(notas || []);
    const asistenciasConMateria = await agregarNombreMateria(asistencias || []);
    const actividadesConMateria = await agregarNombreMateria(actividades || []);

    setNotasAcademicas(notasConMateria);
    setAsistenciasAcademicas(asistenciasConMateria);
    setActividadesAcademicas(actividadesConMateria);

    setCargandoDatos(false);
  }

  async function crearNotificacionParaPadres(estudianteId, titulo, tipo, mensaje) {
    const { data: relaciones, error: errorRelaciones } = await supabase
      .from('padre_estudiante')
      .select('padre_id')
      .eq('estudiante_id', estudianteId);

    if (errorRelaciones) {
      console.log('Error buscando padres:', errorRelaciones.message);
      return;
    }

    if (!relaciones || relaciones.length === 0) {
      console.log('Este estudiante todavía no tiene padre vinculado.');
      return;
    }

    const registros = relaciones.map((relacion) => ({
      usuario_id: relacion.padre_id,
      titulo,
      tipo,
      mensaje,
      leida: false,
    }));

    const { error: errorNotificacion } = await supabase
      .from('notificaciones')
      .insert(registros);

    if (errorNotificacion) {
      console.log('Error guardando notificación interna:', errorNotificacion.message);
    }

    const idsPadres = relaciones.map((relacion) => relacion.padre_id);

    await enviarPushAUsuarios(idsPadres, titulo, mensaje, {
      tipo,
      estudianteId,
    });
  }

  async function guardarNota() {
    if (!usuario?.id || !estudianteProfesorSeleccionado?.id) {
      Alert.alert('Error', 'No se encontró profesor o estudiante.');
      return;
    }

    if (!materiaNotaId) {
      Alert.alert('Campo obligatorio', 'Selecciona una materia.');
      return;
    }

    if (!notaTitulo.trim()) {
      Alert.alert('Campo obligatorio', 'Escribe el título de la nota.');
      return;
    }

    const valorNota = parseFloat(notaValor.replace(',', '.'));

    if (Number.isNaN(valorNota) || valorNota < 1.0 || valorNota > 5.0) {
      Alert.alert('Nota inválida', 'La nota debe estar entre 1.0 y 5.0.');
      return;
    }

    setCargando(true);

    const { error } = await supabase.from('notas').insert({
      profesor_id: usuario.id,
      estudiante_id: estudianteProfesorSeleccionado.id,
      materia_id: materiaNotaId,
      titulo: notaTitulo.trim(),
      descripcion: notaDescripcion.trim() || null,
      periodo: parseInt(notaPeriodo, 10),
      nota: valorNota,
    });

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await crearNotificacionParaPadres(
      estudianteProfesorSeleccionado.id,
      'Nueva nota registrada',
      'nota',
      `Se registró una nueva nota para ${nombreCompleto(estudianteProfesorSeleccionado)}.`
    );

    Alert.alert('Nota registrada', 'La nota fue guardada correctamente.');
    limpiarFormularioNota();
    await cargarRegistrosAcademicos(estudianteProfesorSeleccionado.id, estudianteProfesorSeleccionado);
    setPantalla('detalleEstudianteProfesor');
  }

  function abrirEditarNota(nota) {
    setNotaSeleccionadaEditar(nota);
    setMateriaNotaId(nota.materia_id || '');
    setNotaTitulo(nota.titulo || '');
    setNotaDescripcion(nota.descripcion || '');
    setNotaPeriodo(String(nota.periodo || '1'));
    setNotaValor(String(nota.nota || ''));
    setPantalla('editarNota');
  }

  async function guardarCambiosNota() {
    if (!notaSeleccionadaEditar?.id) {
      Alert.alert('Error', 'No se encontró la nota.');
      return;
    }

    if (!materiaNotaId) {
      Alert.alert('Campo obligatorio', 'Selecciona una materia.');
      return;
    }

    if (!notaTitulo.trim()) {
      Alert.alert('Campo obligatorio', 'Escribe el título de la nota.');
      return;
    }

    const valorNota = parseFloat(notaValor.replace(',', '.'));

    if (Number.isNaN(valorNota) || valorNota < 1.0 || valorNota > 5.0) {
      Alert.alert('Nota inválida', 'La nota debe estar entre 1.0 y 5.0.');
      return;
    }

    setCargando(true);

    const { error } = await supabase
      .from('notas')
      .update({
        materia_id: materiaNotaId,
        titulo: notaTitulo.trim(),
        descripcion: notaDescripcion.trim() || null,
        periodo: parseInt(notaPeriodo, 10),
        nota: valorNota,
      })
      .eq('id', notaSeleccionadaEditar.id);

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Nota actualizada', 'Los cambios se guardaron correctamente.');
    setNotaSeleccionadaEditar(null);
    limpiarFormularioNota();
    await cargarRegistrosAcademicos(estudianteProfesorSeleccionado.id, estudianteProfesorSeleccionado);
    setPantalla('detalleEstudianteProfesor');
  }

  async function eliminarNota(nota) {
    if (!nota?.id) return;

    setCargando(true);

    const { error } = await supabase.from('notas').delete().eq('id', nota.id);

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Nota eliminada', 'La nota fue eliminada correctamente.');
    await cargarRegistrosAcademicos(estudianteProfesorSeleccionado?.id, estudianteProfesorSeleccionado);
  }

  async function guardarAsistencia() {
    if (!usuario?.id || !estudianteProfesorSeleccionado?.id) {
      Alert.alert('Error', 'No se encontró profesor o estudiante.');
      return;
    }

    if (!materiaAsistenciaId) {
      Alert.alert('Campo obligatorio', 'Selecciona una materia.');
      return;
    }

    if (!asistenciaFecha.trim() || !validarFecha(asistenciaFecha.trim())) {
      Alert.alert('Fecha inválida', 'La fecha debe tener este formato: 2026-05-05');
      return;
    }

    setCargando(true);

    const { error } = await supabase.from('asistencias').upsert(
      {
        profesor_id: usuario.id,
        estudiante_id: estudianteProfesorSeleccionado.id,
        materia_id: materiaAsistenciaId,
        fecha: asistenciaFecha.trim(),
        estado: asistenciaEstado,
        observacion: asistenciaObservacion.trim() || null,
      },
      {
        onConflict: 'estudiante_id,materia_id,fecha',
      }
    );

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await crearNotificacionParaPadres(
      estudianteProfesorSeleccionado.id,
      'Asistencia registrada',
      'asistencia',
      `${nombreCompleto(estudianteProfesorSeleccionado)} fue marcado como ${asistenciaEstado}.`
    );

    Alert.alert('Asistencia registrada', 'La asistencia fue guardada correctamente.');
    limpiarFormularioAsistencia();
    await cargarRegistrosAcademicos(estudianteProfesorSeleccionado.id, estudianteProfesorSeleccionado);
    setPantalla('detalleEstudianteProfesor');
  }

  function abrirEditarAsistencia(asistencia) {
    setAsistenciaSeleccionadaEditar(asistencia);
    setMateriaAsistenciaId(asistencia.materia_id || '');
    setAsistenciaFecha(asistencia.fecha || fechaHoy());
    setAsistenciaEstado(asistencia.estado || 'presente');
    setAsistenciaObservacion(asistencia.observacion || '');
    setPantalla('editarAsistencia');
  }

  async function guardarCambiosAsistencia() {
    if (!asistenciaSeleccionadaEditar?.id) {
      Alert.alert('Error', 'No se encontró la asistencia.');
      return;
    }

    if (!materiaAsistenciaId) {
      Alert.alert('Campo obligatorio', 'Selecciona una materia.');
      return;
    }

    if (!asistenciaFecha.trim() || !validarFecha(asistenciaFecha.trim())) {
      Alert.alert('Fecha inválida', 'La fecha debe tener este formato: 2026-05-05');
      return;
    }

    setCargando(true);

    const { error } = await supabase
      .from('asistencias')
      .update({
        materia_id: materiaAsistenciaId,
        fecha: asistenciaFecha.trim(),
        estado: asistenciaEstado,
        observacion: asistenciaObservacion.trim() || null,
      })
      .eq('id', asistenciaSeleccionadaEditar.id);

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Asistencia actualizada', 'Los cambios se guardaron correctamente.');
    setAsistenciaSeleccionadaEditar(null);
    limpiarFormularioAsistencia();
    await cargarRegistrosAcademicos(estudianteProfesorSeleccionado.id, estudianteProfesorSeleccionado);
    setPantalla('detalleEstudianteProfesor');
  }

  async function eliminarAsistencia(asistencia) {
    if (!asistencia?.id) return;

    setCargando(true);

    const { error } = await supabase.from('asistencias').delete().eq('id', asistencia.id);

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Asistencia eliminada', 'La asistencia fue eliminada correctamente.');
    await cargarRegistrosAcademicos(estudianteProfesorSeleccionado?.id, estudianteProfesorSeleccionado);
  }

  async function guardarActividad() {
    if (!usuario?.id || !gradoSeleccionado?.id || !estudianteProfesorSeleccionado?.id) {
      Alert.alert('Error', 'No se encontró profesor, grado o estudiante.');
      return;
    }

    if (!actividadMateriaId) {
      Alert.alert('Campo obligatorio', 'Selecciona una materia.');
      return;
    }

    if (!actividadTitulo.trim()) {
      Alert.alert('Campo obligatorio', 'Escribe el título de la actividad.');
      return;
    }

    if (actividadFechaEntrega.trim() && !validarFecha(actividadFechaEntrega.trim())) {
      Alert.alert('Fecha inválida', 'La fecha debe escribirse con este formato: 2026-05-10');
      return;
    }

    setCargando(true);

    const { error } = await supabase.from('actividades').insert({
      profesor_id: usuario.id,
      grado_id: gradoSeleccionado.id,
      materia_id: actividadMateriaId,
      estudiante_id: estudianteProfesorSeleccionado.id,
      tipo: actividadTipo,
      titulo: actividadTitulo.trim(),
      descripcion: actividadDescripcion.trim() || null,
      fecha_entrega: actividadFechaEntrega.trim() || null,
      estado: 'pendiente',
    });

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await crearNotificacionParaPadres(
      estudianteProfesorSeleccionado.id,
      'Nueva actividad registrada',
      'actividad',
      `Se registró una nueva actividad para ${nombreCompleto(estudianteProfesorSeleccionado)}: ${actividadTitulo.trim()}.`
    );

    Alert.alert('Actividad registrada', 'La actividad fue guardada correctamente.');
    limpiarFormularioActividad();
    await cargarRegistrosAcademicos(estudianteProfesorSeleccionado.id, estudianteProfesorSeleccionado);
    setPantalla('detalleEstudianteProfesor');
  }

  function abrirEditarActividad(actividad) {
    setActividadSeleccionadaEditar(actividad);
    setActividadTipo(actividad.tipo || 'tarea');
    setActividadTitulo(actividad.titulo || '');
    setActividadDescripcion(actividad.descripcion || '');
    setActividadFechaEntrega(actividad.fecha_entrega || '');
    setActividadMateriaId(actividad.materia_id || '');
    setPantalla('editarActividad');
  }

  async function guardarCambiosActividad() {
    if (!actividadSeleccionadaEditar?.id) {
      Alert.alert('Error', 'No se encontró la actividad.');
      return;
    }

    if (!actividadMateriaId) {
      Alert.alert('Campo obligatorio', 'Selecciona una materia.');
      return;
    }

    if (!actividadTitulo.trim()) {
      Alert.alert('Campo obligatorio', 'Escribe el título de la actividad.');
      return;
    }

    if (actividadFechaEntrega.trim() && !validarFecha(actividadFechaEntrega.trim())) {
      Alert.alert('Fecha inválida', 'La fecha debe escribirse con este formato: 2026-05-10');
      return;
    }

    setCargando(true);

    const { error } = await supabase
      .from('actividades')
      .update({
        materia_id: actividadMateriaId,
        tipo: actividadTipo,
        titulo: actividadTitulo.trim(),
        descripcion: actividadDescripcion.trim() || null,
        fecha_entrega: actividadFechaEntrega.trim() || null,
      })
      .eq('id', actividadSeleccionadaEditar.id);

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Actividad actualizada', 'Los cambios se guardaron correctamente.');
    setActividadSeleccionadaEditar(null);
    limpiarFormularioActividad();
    await cargarRegistrosAcademicos(estudianteProfesorSeleccionado.id, estudianteProfesorSeleccionado);
    setPantalla('detalleEstudianteProfesor');
  }

  async function eliminarActividad(actividad) {
    if (!actividad?.id) return;

    setCargando(true);

    const { error } = await supabase.from('actividades').delete().eq('id', actividad.id);

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Actividad eliminada', 'La actividad fue eliminada correctamente.');
    await cargarRegistrosAcademicos(estudianteProfesorSeleccionado?.id, estudianteProfesorSeleccionado);
  }

  async function actualizarEstadoActividad(actividad, nuevoEstado) {
    if (!actividad?.id) {
      Alert.alert('Error', 'No se encontró la actividad.');
      return;
    }

    setCargando(true);

    const { error } = await supabase
      .from('actividades')
      .update({
        estado: nuevoEstado,
      })
      .eq('id', actividad.id);

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await crearNotificacionParaPadres(
      estudianteProfesorSeleccionado.id,
      'Estado de actividad actualizado',
      'actividad',
      `La actividad "${actividad.titulo}" fue marcada como ${nuevoEstado}.`
    );

    Alert.alert('Estado actualizado', `La actividad fue marcada como ${nuevoEstado}.`);

    await cargarRegistrosAcademicos(estudianteProfesorSeleccionado.id, estudianteProfesorSeleccionado);
  }

  async function cargarEstudiantesPadre(padreId = usuario?.id) {
    if (!padreId) return;

    setCargandoDatos(true);

    const { data: relaciones, error: errorRelaciones } = await supabase
      .from('padre_estudiante')
      .select('estudiante_id')
      .eq('padre_id', padreId);

    if (errorRelaciones) {
      setCargandoDatos(false);
      Alert.alert('Error', 'No se pudieron cargar los estudiantes vinculados.');
      return;
    }

    if (!relaciones || relaciones.length === 0) {
      setEstudiantesVinculados([]);
      setCargandoDatos(false);
      return;
    }

    const idsEstudiantes = relaciones.map((relacion) => relacion.estudiante_id);

    const { data: listaEstudiantes, error: errorEstudiantes } = await supabase
      .from('estudiantes')
      .select('*')
      .in('id', idsEstudiantes)
      .order('apellidos', { ascending: true });

    if (errorEstudiantes) {
      setCargandoDatos(false);
      Alert.alert('Error', 'No se pudieron cargar los datos del estudiante.');
      return;
    }

    const idsGrados = [...new Set((listaEstudiantes || []).map((e) => e.grado_id).filter(Boolean))];
    const idsProfesores = [
      ...new Set((listaEstudiantes || []).map((e) => e.profesor_id).filter(Boolean)),
    ];

    let listaGrados = [];
    let listaProfesores = [];

    if (idsGrados.length > 0) {
      const { data } = await supabase.from('grados').select('*').in('id', idsGrados);
      listaGrados = data || [];
    }

    if (idsProfesores.length > 0) {
      const { data } = await supabase.from('profiles').select('*').in('id', idsProfesores);
      listaProfesores = data || [];
    }

    const estudiantesCompletos = (listaEstudiantes || []).map((estudiante) => {
      const grado = listaGrados.find((g) => g.id === estudiante.grado_id);
      const profesor = listaProfesores.find((p) => p.id === estudiante.profesor_id);

      return {
        ...estudiante,
        grado_nombre: nombreGrado(grado),
        profesor_nombre: profesor ? nombreCompleto(profesor) : 'Sin profesor',
      };
    });

    setEstudiantesVinculados(estudiantesCompletos);
    setCargandoDatos(false);
  }

  async function vincularEstudiante() {
    if (!usuario?.id) {
      Alert.alert('Error', 'No se encontró el usuario padre.');
      return;
    }

    if (!identificacionVincular.trim()) {
      Alert.alert('Campo obligatorio', 'Escribe la identificación del estudiante.');
      return;
    }

    setCargando(true);

    const { data: estudiante, error: errorEstudiante } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('identificacion', identificacionVincular.trim())
      .maybeSingle();

    if (errorEstudiante) {
      setCargando(false);
      Alert.alert('Error', 'No se pudo buscar el estudiante.');
      return;
    }

    if (!estudiante) {
      setCargando(false);
      Alert.alert('Estudiante no encontrado', 'No existe un estudiante con esa identificación.');
      return;
    }

    const { error: errorVinculo } = await supabase.from('padre_estudiante').insert({
      padre_id: usuario.id,
      estudiante_id: estudiante.id,
    });

    setCargando(false);

    if (errorVinculo) {
      if (errorVinculo.message.includes('duplicate')) {
        Alert.alert('Ya vinculado', 'Este estudiante ya está vinculado a tu cuenta.');
      } else {
        Alert.alert('Error', errorVinculo.message);
      }
      return;
    }

    Alert.alert('Estudiante vinculado', 'El estudiante fue vinculado correctamente.');
    setIdentificacionVincular('');
    await cargarEstudiantesPadre(usuario.id);
    setPantalla('panelPadre');
  }

  async function seleccionarEstudiantePadre(estudiante) {
    setEstudiantePadreSeleccionado(estudiante);
    await cargarRegistrosAcademicos(estudiante.id, estudiante);
    setPantalla('detalleEstudiantePadre');
  }

  async function cargarNotificaciones(userId = usuario?.id) {
    if (!userId) return;

    setCargandoDatos(true);

    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false });

    setCargandoDatos(false);

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar las notificaciones.');
      return;
    }

    setNotificaciones(data || []);
  }

  async function marcarNotificacionLeida(notificacionId) {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', notificacionId);

    if (error) {
      Alert.alert('Error', 'No se pudo marcar la notificación como leída.');
      return;
    }

    await cargarNotificaciones(usuario?.id);
  }

  async function cargarHorariosProfesor(profesorId = usuario?.id) {
    if (!profesorId) return;

    setCargandoDatos(true);

    const { data, error } = await supabase
      .from('horarios_atencion')
      .select('*')
      .eq('profesor_id', profesorId)
      .eq('activo', true)
      .order('dia_semana', { ascending: true });

    setCargandoDatos(false);

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los horarios.');
      return;
    }

    setHorariosAtencion(data || []);
  }

  async function guardarHorarioAtencion() {
    if (!usuario?.id) {
      Alert.alert('Error', 'No se encontró el profesor.');
      return;
    }

    if (!horaInicio.trim() || !horaFin.trim()) {
      Alert.alert('Campos obligatorios', 'Debes escribir hora de inicio y hora de fin.');
      return;
    }

    if (!validarHora(horaInicio.trim()) || !validarHora(horaFin.trim())) {
      Alert.alert('Formato inválido', 'Escribe las horas así: 14:00');
      return;
    }

    setCargando(true);

    const { error } = await supabase.from('horarios_atencion').insert({
      profesor_id: usuario.id,
      dia_semana: parseInt(diaSemana, 10),
      hora_inicio: horaInicio.trim(),
      hora_fin: horaFin.trim(),
      activo: true,
    });

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Horario guardado', 'El horario de atención fue registrado correctamente.');
    setHoraInicio('');
    setHoraFin('');
    await cargarHorariosProfesor(usuario.id);
  }

  async function abrirChatPadre(estudiante) {
    if (!usuario?.id || !estudiante?.id || !estudiante?.profesor_id) {
      Alert.alert('Error', 'No se pudo abrir el chat.');
      return;
    }

    setCargandoDatos(true);

    let { data: conversacion, error } = await supabase
      .from('conversaciones')
      .select('*')
      .eq('profesor_id', estudiante.profesor_id)
      .eq('padre_id', usuario.id)
      .eq('estudiante_id', estudiante.id)
      .maybeSingle();

    if (error) {
      setCargandoDatos(false);
      Alert.alert('Error', 'No se pudo buscar la conversación.');
      return;
    }

    if (!conversacion) {
      const { data: nuevaConversacion, error: errorCrear } = await supabase
        .from('conversaciones')
        .insert({
          profesor_id: estudiante.profesor_id,
          padre_id: usuario.id,
          estudiante_id: estudiante.id,
        })
        .select('*')
        .single();

      if (errorCrear) {
        setCargandoDatos(false);
        Alert.alert('Error', errorCrear.message);
        return;
      }

      conversacion = nuevaConversacion;
    }

    const conversacionCompleta = {
      ...conversacion,
      estudiante_nombre: nombreCompleto(estudiante),
      padre_nombre: nombreCompleto(perfil),
      profesor_nombre: estudiante.profesor_nombre || 'Profesor',
    };

    setConversacionSeleccionada(conversacionCompleta);
    await cargarHorariosProfesor(estudiante.profesor_id);
    await cargarMensajesChat(conversacion.id);
    setCargandoDatos(false);
    setPantalla('chat');
  }

  async function cargarConversacionesProfesor() {
    if (!usuario?.id) return;

    setCargandoDatos(true);

    const { data: conversaciones, error } = await supabase
      .from('conversaciones')
      .select('*')
      .eq('profesor_id', usuario.id)
      .order('created_at', { ascending: false });

    if (error) {
      setCargandoDatos(false);
      Alert.alert('Error', 'No se pudieron cargar los chats.');
      return;
    }

    if (!conversaciones || conversaciones.length === 0) {
      setConversacionesChat([]);
      setCargandoDatos(false);
      return;
    }

    const idsEstudiantes = [...new Set(conversaciones.map((c) => c.estudiante_id))];
    const idsPadres = [...new Set(conversaciones.map((c) => c.padre_id))];

    const { data: listaEstudiantes } = await supabase
      .from('estudiantes')
      .select('*')
      .in('id', idsEstudiantes);

    const { data: listaPadres } = await supabase
      .from('profiles')
      .select('*')
      .in('id', idsPadres);

    const conversacionesCompletas = conversaciones.map((conv) => {
      const estudiante = (listaEstudiantes || []).find((e) => e.id === conv.estudiante_id);
      const padre = (listaPadres || []).find((p) => p.id === conv.padre_id);

      return {
        ...conv,
        estudiante_nombre: estudiante ? nombreCompleto(estudiante) : 'Estudiante',
        padre_nombre: padre ? nombreCompleto(padre) : 'Padre de familia',
        profesor_nombre: nombreCompleto(perfil),
      };
    });

    setConversacionesChat(conversacionesCompletas);
    setCargandoDatos(false);
  }

  async function seleccionarConversacionProfesor(conversacion) {
    setConversacionSeleccionada(conversacion);
    await cargarHorariosProfesor(usuario?.id);
    await cargarMensajesChat(conversacion.id);
    setPantalla('chat');
  }

  async function cargarMensajesChat(conversacionId = conversacionSeleccionada?.id) {
    if (!conversacionId || !usuario?.id) return;

    setCargandoDatos(true);

    const { data, error } = await supabase
      .from('mensajes_chat')
      .select('*')
      .eq('conversacion_id', conversacionId)
      .order('created_at', { ascending: true });

    setCargandoDatos(false);

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los mensajes.');
      return;
    }

    const mensajes = (data || []).map((msg) => ({
      ...msg,
      es_mio: msg.remitente_id === usuario.id,
    }));

    setMensajesChat(mensajes);

    const mensajesNoLeidos = mensajes
      .filter((msg) => !msg.leido && msg.remitente_id !== usuario.id)
      .map((msg) => msg.id);

    if (mensajesNoLeidos.length > 0) {
      await supabase.from('mensajes_chat').update({ leido: true }).in('id', mensajesNoLeidos);
    }
  }

  async function enviarMensajeChat() {
    if (!usuario?.id || !conversacionSeleccionada?.id) {
      Alert.alert('Error', 'No se encontró la conversación.');
      return;
    }

    if (!mensajeTexto.trim()) {
      Alert.alert('Mensaje vacío', 'Escribe un mensaje antes de enviar.');
      return;
    }

    setCargando(true);

    const { error } = await supabase.from('mensajes_chat').insert({
      conversacion_id: conversacionSeleccionada.id,
      remitente_id: usuario.id,
      mensaje: mensajeTexto.trim(),
    });

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    const receptorId =
      usuario.id === conversacionSeleccionada.padre_id
        ? conversacionSeleccionada.profesor_id
        : conversacionSeleccionada.padre_id;

    if (receptorId) {
      const titulo = 'Nuevo mensaje';
      const mensaje = `Tienes un nuevo mensaje en el chat de ${
        conversacionSeleccionada.estudiante_nombre || 'un estudiante'
      }.`;

      await supabase.from('notificaciones').insert({
        usuario_id: receptorId,
        titulo,
        tipo: 'chat',
        mensaje,
        leida: false,
      });

      await enviarPushAUsuarios([receptorId], titulo, mensaje, {
        tipo: 'chat',
        conversacionId: conversacionSeleccionada.id,
      });
    }

    setMensajeTexto('');
    await cargarMensajesChat(conversacionSeleccionada.id);
  }

  function limpiarFormularioRegistro() {
    setNombres('');
    setApellidos('');
    setTelefono('');
    setEmail('');
    setPassword('');
    setRol('profesor');
  }

  function limpiarFormularioEstudiante() {
    setEstudianteNombres('');
    setEstudianteApellidos('');
    setEstudianteDireccion('');
    setEstudianteFechaNacimiento('');
    setEstudianteIdentificacion('');
  }

  function limpiarFormularioNota() {
    setMateriaNotaId('');
    setNotaTitulo('');
    setNotaDescripcion('');
    setNotaPeriodo('1');
    setNotaValor('');
  }

  function limpiarFormularioAsistencia() {
    setMateriaAsistenciaId('');
    setAsistenciaFecha(fechaHoy());
    setAsistenciaEstado('presente');
    setAsistenciaObservacion('');
  }

  function limpiarFormularioActividad() {
    setActividadTipo('tarea');
    setActividadTitulo('');
    setActividadDescripcion('');
    setActividadFechaEntrega('');
    setActividadMateriaId('');
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();

    setUsuario(null);
    setPerfil(null);

    setPerfilNombres('');
    setPerfilApellidos('');
    setPerfilTelefono('');
    setNuevaPassword('');

    setEmail('');
    setPassword('');
    limpiarFormularioRegistro();

    setGrados([]);
    setGradoSeleccionado(null);
    setGradoNumero('');

    setMaterias([]);
    setMateriaSeleccionadaEditar(null);
    setMateriaNombre('');
    setMateriaDescripcion('');

    setEstudiantes([]);
    setBusquedaEstudiante('');
    limpiarFormularioEstudiante();

    setEstudianteProfesorSeleccionado(null);
    setEstudiantePadreSeleccionado(null);
    setEstudiantesVinculados([]);
    setIdentificacionVincular('');

    setNotasAcademicas([]);
    setAsistenciasAcademicas([]);
    setActividadesAcademicas([]);

    setNotaSeleccionadaEditar(null);
    setAsistenciaSeleccionadaEditar(null);
    setActividadSeleccionadaEditar(null);

    limpiarFormularioNota();
    limpiarFormularioAsistencia();
    limpiarFormularioActividad();

    setNotificaciones([]);

    setHorariosAtencion([]);
    setDiaSemana('1');
    setHoraInicio('');
    setHoraFin('');

    setConversacionesChat([]);
    setConversacionSeleccionada(null);
    setMensajesChat([]);
    setMensajeTexto('');

    setPantalla('bienvenida');
  }

  function SelectorMateriasLocal({ seleccionada, cambiar }) {
    return (
      <>
        <Text style={styles.seccionTitulo}>Materia</Text>

        {materias.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>No hay materias registradas.</Text>
          </View>
        ) : (
          materias.map((materia) => (
            <TouchableOpacity
              key={materia.id}
              style={[
                styles.botonOpcion,
                seleccionada === materia.id && styles.botonOpcionActivo,
              ]}
              onPress={() => cambiar(materia.id)}
            >
              <Text
                style={[
                  styles.textoOpcion,
                  seleccionada === materia.id && styles.textoOpcionActivo,
                ]}
              >
                {materia.nombre}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </>
    );
  }

  const estudiantesFiltrados = estudiantes.filter((estudiante) => {
    const texto = `${estudiante.nombres} ${estudiante.apellidos} ${estudiante.identificacion}`.toLowerCase();
    return texto.includes(busquedaEstudiante.toLowerCase());
  });

  const estudiantesPadreFiltrados = estudiantesVinculados.filter((estudiante) => {
    const texto = `${estudiante.nombres} ${estudiante.apellidos} ${estudiante.identificacion}`.toLowerCase();
    return texto.includes(busquedaEstudiante.toLowerCase());
  });

  const actividadesCalendario = [...actividadesAcademicas].sort((a, b) => {
    const fechaA = a.fecha_entrega || a.created_at || '';
    const fechaB = b.fecha_entrega || b.created_at || '';
    return fechaA.localeCompare(fechaB);
  });

  if (pantalla === 'bienvenida') {
    return (
      <Pantalla centrado>
        <Text style={styles.logoTexto}>Aula360</Text>
        <Text style={styles.descripcion}>
          Seguimiento académico y comunicación inmediata entre profesor y padre de familia.
        </Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>Bienvenido</Text>
          <Text style={styles.textoTarjeta}>
            Registra notas, asistencia, tareas, exámenes, actividades y comunícate sin usar WhatsApp.
          </Text>

          <BotonPrincipal titulo="Crear cuenta" onPress={() => setPantalla('registro')} />
          <BotonSecundario titulo="Iniciar sesión" onPress={() => setPantalla('login')} />
        </View>
      </Pantalla>
    );
  }

  if (pantalla === 'registro') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Crear cuenta</Text>
        <Text style={styles.subtituloPantalla}>Selecciona tu rol y registra tus datos.</Text>

        <View style={styles.selectorRol}>
          <TouchableOpacity
            style={[styles.botonRol, rol === 'profesor' && styles.botonRolActivo]}
            onPress={() => setRol('profesor')}
          >
            <Text style={[styles.textoRol, rol === 'profesor' && styles.textoRolActivo]}>
              Profesor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botonRol, rol === 'padre' && styles.botonRolActivo]}
            onPress={() => setRol('padre')}
          >
            <Text style={[styles.textoRol, rol === 'padre' && styles.textoRolActivo]}>
              Padre
            </Text>
          </TouchableOpacity>
        </View>

        <Campo placeholder="Nombres" value={nombres} onChangeText={setNombres} />
        <Campo placeholder="Apellidos" value={apellidos} onChangeText={setApellidos} />
        <Campo
          placeholder="Teléfono opcional"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />
        <Campo
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Campo
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal titulo="Registrarme" onPress={registrarUsuario} />
        )}

        <BotonSecundario titulo="Volver" onPress={() => setPantalla('bienvenida')} />
      </Pantalla>
    );
  }

  if (pantalla === 'login') {
    return (
      <Pantalla centrado>
        <Text style={styles.tituloPantalla}>Iniciar sesión</Text>
        <Text style={styles.subtituloPantalla}>Ingresa con tu correo y contraseña.</Text>

        <Campo
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Campo
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal titulo="Entrar" onPress={iniciarSesion} />
        )}

        <BotonSecundario
          titulo="Recuperar contraseña"
          onPress={() => setPantalla('recuperarPassword')}
        />
        <BotonSecundario titulo="Volver" onPress={() => setPantalla('bienvenida')} />
      </Pantalla>
    );
  }

  if (pantalla === 'recuperarPassword') {
    return (
      <Pantalla centrado>
        <Text style={styles.tituloPantalla}>Recuperar contraseña</Text>
        <Text style={styles.subtituloPantalla}>
          Escribe tu correo y recibirás las instrucciones para restablecer la contraseña.
        </Text>

        <Campo
          placeholder="Correo electrónico"
          value={correoRecuperacion}
          onChangeText={setCorreoRecuperacion}
          keyboardType="email-address"
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal titulo="Enviar correo" onPress={enviarRecuperacionPassword} />
        )}

        <BotonSecundario titulo="Volver" onPress={() => setPantalla('login')} />
      </Pantalla>
    );
  }

  if (pantalla === 'perfilUsuario') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Mi perfil</Text>
        <Text style={styles.subtituloPantalla}>
          Aquí puedes revisar y actualizar tus datos básicos.
        </Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>Datos de la cuenta</Text>
          <Text style={styles.textoDetalle}>Rol: {perfil?.rol || 'Sin rol'}</Text>
          <Text style={styles.textoDetalle}>Correo: {usuario?.email || 'Sin correo'}</Text>
        </View>

        <Campo placeholder="Nombres" value={perfilNombres} onChangeText={setPerfilNombres} />
        <Campo placeholder="Apellidos" value={perfilApellidos} onChangeText={setPerfilApellidos} />
        <Campo
          placeholder="Teléfono"
          value={perfilTelefono}
          onChangeText={setPerfilTelefono}
          keyboardType="phone-pad"
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal titulo="Guardar cambios" onPress={guardarCambiosPerfil} />
        )}

        <BotonSecundario
          titulo="Volver"
          onPress={() => {
            if (perfil?.rol === 'profesor') {
              setPantalla('panelProfesor');
            } else {
              setPantalla('panelPadre');
            }
          }}
        />
      </Pantalla>
    );
  }

  if (pantalla === 'configuracion') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Configuración</Text>
        <Text style={styles.subtituloPantalla}>Gestiona opciones básicas de tu cuenta.</Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>Cuenta</Text>
          <Text style={styles.textoDetalle}>Usuario: {nombreCompleto(perfil)}</Text>
          <Text style={styles.textoDetalle}>Correo: {usuario?.email}</Text>
          <Text style={styles.textoDetalle}>Rol: {perfil?.rol}</Text>
        </View>

        <Campo
          placeholder="Nueva contraseña"
          value={nuevaPassword}
          onChangeText={setNuevaPassword}
          secureTextEntry
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal titulo="Cambiar contraseña" onPress={cambiarPasswordDesdeConfiguracion} />
        )}

        <BotonSecundario titulo="Mi perfil" onPress={abrirPerfilUsuario} />
        <BotonPeligro titulo="Cerrar sesión" onPress={cerrarSesion} />

        <BotonSecundario
          titulo="Volver"
          onPress={() => {
            if (perfil?.rol === 'profesor') {
              setPantalla('panelProfesor');
            } else {
              setPantalla('panelPadre');
            }
          }}
        />
      </Pantalla>
    );
  }

  if (pantalla === 'ayuda') {
    const esProfesor = perfil?.rol === 'profesor';

    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Ayuda</Text>
        <Text style={styles.subtituloPantalla}>
          Guía rápida para usar Aula360 correctamente.
        </Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>
            {esProfesor ? 'Guía para el profesor' : 'Guía para el padre de familia'}
          </Text>

          {esProfesor ? (
            <>
              <Text style={styles.textoDetalle}>1. Ingresa al panel del profesor.</Text>
              <Text style={styles.textoDetalle}>2. Crea grados y materias.</Text>
              <Text style={styles.textoDetalle}>3. Registra estudiantes.</Text>
              <Text style={styles.textoDetalle}>
                4. Selecciona un estudiante para registrar notas, asistencia y actividades.
              </Text>
              <Text style={styles.textoDetalle}>
                5. Usa el chat institucional para comunicarte con los padres.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.textoDetalle}>1. Ingresa al panel del padre.</Text>
              <Text style={styles.textoDetalle}>2. Presiona “Vincular estudiante”.</Text>
              <Text style={styles.textoDetalle}>3. Escribe la identificación del estudiante.</Text>
              <Text style={styles.textoDetalle}>4. Revisa notas, asistencia, actividades y chat.</Text>
              <Text style={styles.textoDetalle}>5. Activa las notificaciones para recibir alertas.</Text>
            </>
          )}
        </View>

        <BotonSecundario
          titulo="Volver"
          onPress={() => {
            if (perfil?.rol === 'profesor') {
              setPantalla('panelProfesor');
            } else {
              setPantalla('panelPadre');
            }
          }}
        />
      </Pantalla>
    );
  }

  if (pantalla === 'panelProfesor') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Panel del profesor</Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>
            Hola, {perfil?.nombres} {perfil?.apellidos}
          </Text>

          <Text style={styles.textoTarjeta}>
            Desde aquí podrás crear grados, materias, estudiantes, notas, asistencia,
            actividades y responder mensajes institucionales.
          </Text>

          <BotonSecundario titulo="Mi perfil" onPress={abrirPerfilUsuario} />
          <BotonSecundario titulo="Configuración" onPress={() => setPantalla('configuracion')} />
          <BotonSecundario titulo="Ayuda" onPress={() => setPantalla('ayuda')} />

          <BotonPrincipal
            titulo="Activar notificaciones"
            onPress={() => registrarTokenPush(usuario?.id, true)}
          />

          <BotonPrincipal
            titulo="Crear grado"
            onPress={() => {
              setGradoNumero('');
              setPantalla('crearGrado');
            }}
          />
          <BotonSecundario titulo="Actualizar grados" onPress={() => cargarGrados(usuario?.id)} />
          <BotonSecundario
            titulo="Horario de atención"
            onPress={async () => {
              setHoraInicio('');
              setHoraFin('');
              await cargarHorariosProfesor(usuario?.id);
              setPantalla('horarios');
            }}
          />
          <BotonSecundario
            titulo="Chats institucionales"
            onPress={async () => {
              await cargarConversacionesProfesor();
              setPantalla('conversacionesProfesor');
            }}
          />
          <BotonSecundario
            titulo="Ver notificaciones"
            onPress={async () => {
              await cargarNotificaciones(usuario?.id);
              setPantalla('notificaciones');
            }}
          />
        </View>

        <Text style={styles.seccionTitulo}>Mis grados</Text>

        {cargandoDatos ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : grados.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>Todavía no tienes grados registrados.</Text>
          </View>
        ) : (
          grados.map((grado) => (
            <View key={grado.id} style={styles.itemListaVertical}>
              <TouchableOpacity style={styles.filaEntre} onPress={() => seleccionarGrado(grado)}>
                <View>
                  <Text style={styles.itemTitulo}>{nombreGrado(grado)}</Text>
                  <Text style={styles.itemSubtitulo}>Presiona para ver materias y estudiantes</Text>
                </View>
                <Text style={styles.itemFlecha}>›</Text>
              </TouchableOpacity>

              <BotonPeligro
                titulo="Eliminar grado"
                onPress={() =>
                  confirmarEliminar(
                    'Eliminar grado',
                    '¿Seguro que deseas eliminar este grado?',
                    () => eliminarGrado(grado)
                  )
                }
              />
            </View>
          ))
        )}

        <BotonPrincipal titulo="Cerrar sesión" onPress={cerrarSesion} />
      </Pantalla>
    );
  }

  if (pantalla === 'crearGrado') {
    const numeros = Array.from({ length: 11 }, (_, i) => i + 1);

    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Crear grado</Text>
        <Text style={styles.subtituloPantalla}>Selecciona el grado que deseas registrar.</Text>

        <View style={styles.contenedorNumeros}>
          {numeros.map((numero) => (
            <TouchableOpacity
              key={numero}
              style={[styles.botonNumero, gradoNumero === String(numero) && styles.botonNumeroActivo]}
              onPress={() => setGradoNumero(String(numero))}
            >
              <Text
                style={[styles.textoNumero, gradoNumero === String(numero) && styles.textoNumeroActivo]}
              >
                {numero}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Campo
          placeholder="O escribe el número del grado"
          value={gradoNumero}
          onChangeText={setGradoNumero}
          keyboardType="numeric"
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal titulo="Guardar grado" onPress={guardarGrado} />
        )}

        <BotonSecundario titulo="Volver" onPress={() => setPantalla('panelProfesor')} />
      </Pantalla>
    );
  }

  if (pantalla === 'detalleGrado') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>{nombreGrado(gradoSeleccionado)}</Text>
        <Text style={styles.subtituloPantalla}>Aquí se registran materias y estudiantes.</Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>Gestión del grado</Text>
          <Text style={styles.textoTarjeta}>
            Registra materias y estudiantes. Después podrás registrar notas, asistencia y actividades.
          </Text>

          <BotonPrincipal
            titulo="Crear materia"
            onPress={() => {
              setMateriaNombre('');
              setMateriaDescripcion('');
              setPantalla('crearMateria');
            }}
          />

          <BotonPrincipal
            titulo="Registrar estudiante"
            onPress={() => {
              limpiarFormularioEstudiante();
              setPantalla('crearEstudiante');
            }}
          />

          <BotonSecundario
            titulo="Actualizar información"
            onPress={async () => {
              await cargarMaterias(gradoSeleccionado?.id);
              await cargarEstudiantes(gradoSeleccionado?.id);
            }}
          />
        </View>

        <Text style={styles.seccionTitulo}>Materias registradas</Text>

        {materias.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>Todavía no hay materias registradas.</Text>
          </View>
        ) : (
          materias.map((materia) => (
            <View key={materia.id} style={styles.itemListaVertical}>
              <Text style={styles.itemTitulo}>{materia.nombre}</Text>
              <Text style={styles.itemSubtitulo}>{materia.descripcion || 'Sin descripción'}</Text>
              <BotonSecundario titulo="Editar materia" onPress={() => seleccionarMateriaEditar(materia)} />
              <BotonPeligro
                titulo="Eliminar materia"
                onPress={() =>
                  confirmarEliminar(
                    'Eliminar materia',
                    '¿Seguro que deseas eliminar esta materia?',
                    () => eliminarMateria(materia)
                  )
                }
              />
            </View>
          ))
        )}

        <Text style={styles.seccionTitulo}>Buscar estudiante</Text>

        <Campo
          placeholder="Buscar por nombre, apellido o identificación"
          value={busquedaEstudiante}
          onChangeText={setBusquedaEstudiante}
        />

        <Text style={styles.seccionTitulo}>Estudiantes registrados</Text>

        {estudiantesFiltrados.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>No hay estudiantes para mostrar.</Text>
          </View>
        ) : (
          estudiantesFiltrados.map((estudiante) => (
            <TouchableOpacity
              key={estudiante.id}
              style={styles.itemLista}
              onPress={() => seleccionarEstudianteProfesor(estudiante)}
            >
              <View style={styles.itemContenido}>
                <Text style={styles.itemTitulo}>
                  {estudiante.nombres} {estudiante.apellidos}
                </Text>
                <Text style={styles.itemSubtitulo}>
                  Identificación: {estudiante.identificacion}
                </Text>
              </View>
              <Text style={styles.itemFlecha}>›</Text>
            </TouchableOpacity>
          ))
        )}

        <BotonSecundario
          titulo="Volver al panel"
          onPress={() => {
            setGradoSeleccionado(null);
            setMaterias([]);
            setEstudiantes([]);
            setBusquedaEstudiante('');
            setPantalla('panelProfesor');
          }}
        />
      </Pantalla>
    );
  }

  if (pantalla === 'crearMateria' || pantalla === 'editarMateria') {
    const editando = pantalla === 'editarMateria';

    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>{editando ? 'Editar materia' : 'Crear materia'}</Text>
        <Text style={styles.subtituloPantalla}>Grado seleccionado: {nombreGrado(gradoSeleccionado)}</Text>

        <Campo
          placeholder="Nombre de la materia"
          value={materiaNombre}
          onChangeText={setMateriaNombre}
        />
        <Campo
          placeholder="Descripción opcional"
          value={materiaDescripcion}
          onChangeText={setMateriaDescripcion}
          multiline
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal
            titulo={editando ? 'Guardar cambios' : 'Guardar materia'}
            onPress={editando ? guardarCambiosMateria : guardarMateria}
          />
        )}

        <BotonSecundario titulo="Volver" onPress={() => setPantalla('detalleGrado')} />
      </Pantalla>
    );
  }

  if (pantalla === 'crearEstudiante' || pantalla === 'editarEstudiante') {
    const editando = pantalla === 'editarEstudiante';

    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>
          {editando ? 'Editar estudiante' : 'Registrar estudiante'}
        </Text>
        <Text style={styles.subtituloPantalla}>Grado seleccionado: {nombreGrado(gradoSeleccionado)}</Text>

        <Campo
          placeholder="Nombres del estudiante"
          value={estudianteNombres}
          onChangeText={setEstudianteNombres}
        />
        <Campo
          placeholder="Apellidos del estudiante"
          value={estudianteApellidos}
          onChangeText={setEstudianteApellidos}
        />
        <Campo
          placeholder="Dirección"
          value={estudianteDireccion}
          onChangeText={setEstudianteDireccion}
        />
        <Campo
          placeholder="Fecha de nacimiento: 2010-05-20"
          value={estudianteFechaNacimiento}
          onChangeText={setEstudianteFechaNacimiento}
          keyboardType="numbers-and-punctuation"
        />
        <Campo
          placeholder="Identificación del estudiante"
          value={estudianteIdentificacion}
          onChangeText={setEstudianteIdentificacion}
          keyboardType="numeric"
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal
            titulo={editando ? 'Guardar cambios' : 'Guardar estudiante'}
            onPress={editando ? guardarCambiosEstudiante : guardarEstudiante}
          />
        )}

        <BotonSecundario
          titulo="Volver"
          onPress={() => setPantalla(editando ? 'detalleEstudianteProfesor' : 'detalleGrado')}
        />
      </Pantalla>
    );
  }

  if (pantalla === 'detalleEstudianteProfesor') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Registro académico</Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>
            {estudianteProfesorSeleccionado?.nombres} {estudianteProfesorSeleccionado?.apellidos}
          </Text>
          <Text style={styles.textoDetalle}>Grado: {nombreGrado(gradoSeleccionado)}</Text>
          <Text style={styles.textoDetalle}>
            Identificación: {estudianteProfesorSeleccionado?.identificacion}
          </Text>
          <Text style={styles.textoDetalle}>
            Dirección: {estudianteProfesorSeleccionado?.direccion || 'Sin dirección'}
          </Text>

          <BotonSecundario titulo="Editar datos del estudiante" onPress={abrirEditarEstudiante} />
          <BotonSecundario titulo="Reporte académico" onPress={() => setPantalla('reporteAcademico')} />
          <BotonSecundario titulo="Calendario académico" onPress={() => setPantalla('calendarioAcademico')} />

          <BotonPrincipal
            titulo="Registrar nota"
            onPress={() => {
              limpiarFormularioNota();
              setPantalla('registrarNota');
            }}
          />
          <BotonPrincipal
            titulo="Registrar asistencia"
            onPress={() => {
              limpiarFormularioAsistencia();
              setPantalla('registrarAsistencia');
            }}
          />
          <BotonPrincipal
            titulo="Registrar actividad"
            onPress={() => {
              limpiarFormularioActividad();
              setPantalla('registrarActividad');
            }}
          />
          <BotonSecundario
            titulo="Actualizar registros"
            onPress={() =>
              cargarRegistrosAcademicos(
                estudianteProfesorSeleccionado?.id,
                estudianteProfesorSeleccionado
              )
            }
          />
          <BotonPeligro
            titulo="Eliminar estudiante"
            onPress={() =>
              confirmarEliminar(
                'Eliminar estudiante',
                '¿Seguro que deseas eliminar este estudiante?',
                () => eliminarEstudiante(estudianteProfesorSeleccionado)
              )
            }
          />
        </View>

        <ResumenAcademico
          notasAcademicas={notasAcademicas}
          asistenciasAcademicas={asistenciasAcademicas}
          actividadesAcademicas={actividadesAcademicas}
        />

        <Text style={styles.seccionTitulo}>Notas registradas</Text>

        {notasAcademicas.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>Este estudiante todavía no tiene notas.</Text>
          </View>
        ) : (
          notasAcademicas.map((nota) => (
            <View key={nota.id} style={styles.itemListaVertical}>
              <Text style={styles.itemTitulo}>{nota.titulo}</Text>
              <Text style={styles.itemSubtitulo}>Materia: {nota.materia_nombre}</Text>
              <Text style={styles.itemSubtitulo}>Periodo: {nota.periodo || 'Sin periodo'}</Text>
              <Text style={styles.notaGrande}>Nota: {nota.nota}</Text>
              <Text style={styles.itemSubtitulo}>
                Desempeño: {nota.desempeno || obtenerDesempenoPromedio(Number(nota.nota))}
              </Text>
              <BotonSecundario titulo="Editar nota" onPress={() => abrirEditarNota(nota)} />
              <BotonPeligro
                titulo="Eliminar nota"
                onPress={() =>
                  confirmarEliminar('Eliminar nota', '¿Seguro que deseas eliminar esta nota?', () =>
                    eliminarNota(nota)
                  )
                }
              />
            </View>
          ))
        )}

        <Text style={styles.seccionTitulo}>Asistencias registradas</Text>

        {asistenciasAcademicas.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>Este estudiante todavía no tiene asistencias.</Text>
          </View>
        ) : (
          asistenciasAcademicas.map((asistencia) => (
            <View key={asistencia.id} style={styles.itemListaVertical}>
              <Text style={styles.itemTitulo}>{asistencia.materia_nombre}</Text>
              <Text style={styles.itemSubtitulo}>Fecha: {asistencia.fecha}</Text>
              <Text style={styles.estadoTexto}>Estado: {asistencia.estado}</Text>
              <Text style={styles.itemSubtitulo}>
                Observación: {asistencia.observacion || 'Sin observación'}
              </Text>
              <BotonSecundario
                titulo="Editar asistencia"
                onPress={() => abrirEditarAsistencia(asistencia)}
              />
              <BotonPeligro
                titulo="Eliminar asistencia"
                onPress={() =>
                  confirmarEliminar(
                    'Eliminar asistencia',
                    '¿Seguro que deseas eliminar esta asistencia?',
                    () => eliminarAsistencia(asistencia)
                  )
                }
              />
            </View>
          ))
        )}

        <Text style={styles.seccionTitulo}>Actividades registradas</Text>

        {actividadesAcademicas.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>Este estudiante todavía no tiene actividades.</Text>
          </View>
        ) : (
          actividadesAcademicas.map((actividad) => (
            <View key={actividad.id} style={styles.itemListaVertical}>
              <Text style={styles.itemTitulo}>{actividad.titulo}</Text>
              <Text style={styles.itemSubtitulo}>Tipo: {actividad.tipo}</Text>
              <Text style={styles.itemSubtitulo}>Materia: {actividad.materia_nombre}</Text>
              <Text style={styles.itemSubtitulo}>
                Fecha de entrega: {actividad.fecha_entrega || 'Sin fecha'}
              </Text>
              <Text style={styles.estadoTexto}>Estado: {actividad.estado}</Text>
              <Text style={styles.itemSubtitulo}>
                Descripción: {actividad.descripcion || 'Sin descripción'}
              </Text>

              <Text style={styles.seccionTituloInterno}>Cambiar estado</Text>

              <BotonSecundario
                titulo="Marcar como pendiente"
                onPress={() => actualizarEstadoActividad(actividad, 'pendiente')}
              />

              <BotonSecundario
                titulo="Marcar como entregada"
                onPress={() => actualizarEstadoActividad(actividad, 'entregada')}
              />

              <BotonSecundario
                titulo="Marcar como no entregada"
                onPress={() => actualizarEstadoActividad(actividad, 'no entregada')}
              />

              <BotonSecundario
                titulo="Marcar como revisada"
                onPress={() => actualizarEstadoActividad(actividad, 'revisada')}
              />

              <BotonSecundario
                titulo="Editar actividad"
                onPress={() => abrirEditarActividad(actividad)}
              />

              <BotonPeligro
                titulo="Eliminar actividad"
                onPress={() =>
                  confirmarEliminar(
                    'Eliminar actividad',
                    '¿Seguro que deseas eliminar esta actividad?',
                    () => eliminarActividad(actividad)
                  )
                }
              />
            </View>
          ))
        )}

        <BotonSecundario titulo="Volver al grado" onPress={() => setPantalla('detalleGrado')} />
      </Pantalla>
    );
  }

  if (pantalla === 'registrarNota' || pantalla === 'editarNota') {
    const editando = pantalla === 'editarNota';

    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>{editando ? 'Editar nota' : 'Registrar nota'}</Text>
        <Text style={styles.subtituloPantalla}>
          Estudiante: {nombreCompleto(estudianteProfesorSeleccionado)}
        </Text>

        <SelectorMateriasLocal seleccionada={materiaNotaId} cambiar={setMateriaNotaId} />

        <Campo placeholder="Título, ejemplo: Quiz" value={notaTitulo} onChangeText={setNotaTitulo} />
        <Campo
          placeholder="Descripción opcional"
          value={notaDescripcion}
          onChangeText={setNotaDescripcion}
          multiline
        />

        <Text style={styles.seccionTitulo}>Periodo</Text>

        <View style={styles.filaOpciones}>
          {['1', '2', '3', '4'].map((periodo) => (
            <TouchableOpacity
              key={periodo}
              style={[styles.botonPeriodo, notaPeriodo === periodo && styles.botonOpcionActivo]}
              onPress={() => setNotaPeriodo(periodo)}
            >
              <Text
                style={[styles.textoOpcion, notaPeriodo === periodo && styles.textoOpcionActivo]}
              >
                {periodo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Campo
          placeholder="Nota de 1.0 a 5.0"
          value={notaValor}
          onChangeText={setNotaValor}
          keyboardType="decimal-pad"
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal
            titulo={editando ? 'Guardar cambios' : 'Guardar nota'}
            onPress={editando ? guardarCambiosNota : guardarNota}
          />
        )}

        <BotonSecundario titulo="Volver" onPress={() => setPantalla('detalleEstudianteProfesor')} />
      </Pantalla>
    );
  }

  if (pantalla === 'registrarAsistencia' || pantalla === 'editarAsistencia') {
    const editando = pantalla === 'editarAsistencia';
    const estados = ['presente', 'ausente', 'tarde', 'justificado'];

    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>
          {editando ? 'Editar asistencia' : 'Registrar asistencia'}
        </Text>
        <Text style={styles.subtituloPantalla}>
          Estudiante: {nombreCompleto(estudianteProfesorSeleccionado)}
        </Text>

        <SelectorMateriasLocal
          seleccionada={materiaAsistenciaId}
          cambiar={setMateriaAsistenciaId}
        />

        <Campo
          placeholder="Fecha: 2026-05-05"
          value={asistenciaFecha}
          onChangeText={setAsistenciaFecha}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.seccionTitulo}>Estado</Text>

        {estados.map((estado) => (
          <TouchableOpacity
            key={estado}
            style={[styles.botonOpcion, asistenciaEstado === estado && styles.botonOpcionActivo]}
            onPress={() => setAsistenciaEstado(estado)}
          >
            <Text style={[styles.textoOpcion, asistenciaEstado === estado && styles.textoOpcionActivo]}>
              {estado}
            </Text>
          </TouchableOpacity>
        ))}

        <Campo
          placeholder="Observación opcional"
          value={asistenciaObservacion}
          onChangeText={setAsistenciaObservacion}
          multiline
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal
            titulo={editando ? 'Guardar cambios' : 'Guardar asistencia'}
            onPress={editando ? guardarCambiosAsistencia : guardarAsistencia}
          />
        )}

        <BotonSecundario titulo="Volver" onPress={() => setPantalla('detalleEstudianteProfesor')} />
      </Pantalla>
    );
  }

  if (pantalla === 'registrarActividad' || pantalla === 'editarActividad') {
    const editando = pantalla === 'editarActividad';

    const tipos = [
      'tarea',
      'examen',
      'trabajo',
      'exposicion',
      'actividad',
      'taller',
      'evaluacion',
      'recuperacion',
    ];

    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>
          {editando ? 'Editar actividad' : 'Registrar actividad'}
        </Text>
        <Text style={styles.subtituloPantalla}>
          Estudiante: {nombreCompleto(estudianteProfesorSeleccionado)}
        </Text>

        <Text style={styles.seccionTitulo}>Tipo de actividad</Text>

        {tipos.map((tipo) => (
          <TouchableOpacity
            key={tipo}
            style={[styles.botonOpcion, actividadTipo === tipo && styles.botonOpcionActivo]}
            onPress={() => setActividadTipo(tipo)}
          >
            <Text style={[styles.textoOpcion, actividadTipo === tipo && styles.textoOpcionActivo]}>
              {tipo}
            </Text>
          </TouchableOpacity>
        ))}

        <SelectorMateriasLocal seleccionada={actividadMateriaId} cambiar={setActividadMateriaId} />

        <Campo
          placeholder="Título de la actividad"
          value={actividadTitulo}
          onChangeText={setActividadTitulo}
        />
        <Campo
          placeholder="Descripción opcional"
          value={actividadDescripcion}
          onChangeText={setActividadDescripcion}
          multiline
        />
        <Campo
          placeholder="Fecha de entrega: 2026-05-10"
          value={actividadFechaEntrega}
          onChangeText={setActividadFechaEntrega}
          keyboardType="numbers-and-punctuation"
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal
            titulo={editando ? 'Guardar cambios' : 'Guardar actividad'}
            onPress={editando ? guardarCambiosActividad : guardarActividad}
          />
        )}

        <BotonSecundario titulo="Volver" onPress={() => setPantalla('detalleEstudianteProfesor')} />
      </Pantalla>
    );
  }

  if (pantalla === 'panelPadre') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Panel del padre</Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>
            Hola, {perfil?.nombres} {perfil?.apellidos}
          </Text>

          <Text style={styles.textoTarjeta}>
            Desde aquí podrás vincularte con el estudiante, consultar su información y chatear con el profesor.
          </Text>

          <BotonSecundario titulo="Mi perfil" onPress={abrirPerfilUsuario} />
          <BotonSecundario titulo="Configuración" onPress={() => setPantalla('configuracion')} />
          <BotonSecundario titulo="Ayuda" onPress={() => setPantalla('ayuda')} />

          <BotonPrincipal
            titulo="Activar notificaciones"
            onPress={() => registrarTokenPush(usuario?.id, true)}
          />

          <BotonPrincipal
            titulo="Vincular estudiante"
            onPress={() => {
              setIdentificacionVincular('');
              setPantalla('vincularEstudiante');
            }}
          />

          <BotonSecundario
            titulo="Actualizar estudiantes"
            onPress={() => cargarEstudiantesPadre(usuario?.id)}
          />

          <BotonSecundario
            titulo="Ver notificaciones"
            onPress={async () => {
              await cargarNotificaciones(usuario?.id);
              setPantalla('notificaciones');
            }}
          />
        </View>

        <Text style={styles.seccionTitulo}>Buscar estudiante</Text>

        <Campo
          placeholder="Buscar por nombre, apellido o identificación"
          value={busquedaEstudiante}
          onChangeText={setBusquedaEstudiante}
        />

        <Text style={styles.seccionTitulo}>Estudiantes vinculados</Text>

        {cargandoDatos ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : estudiantesPadreFiltrados.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>No tienes estudiantes vinculados para mostrar.</Text>
          </View>
        ) : (
          estudiantesPadreFiltrados.map((estudiante) => (
            <TouchableOpacity
              key={estudiante.id}
              style={styles.itemLista}
              onPress={() => seleccionarEstudiantePadre(estudiante)}
            >
              <View style={styles.itemContenido}>
                <Text style={styles.itemTitulo}>
                  {estudiante.nombres} {estudiante.apellidos}
                </Text>
                <Text style={styles.itemSubtitulo}>
                  Identificación: {estudiante.identificacion}
                </Text>
                <Text style={styles.itemSubtitulo}>
                  Grado: {estudiante.grado_nombre || 'Sin grado'}
                </Text>
              </View>
              <Text style={styles.itemFlecha}>›</Text>
            </TouchableOpacity>
          ))
        )}

        <BotonPrincipal titulo="Cerrar sesión" onPress={cerrarSesion} />
      </Pantalla>
    );
  }

  if (pantalla === 'vincularEstudiante') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Vincular estudiante</Text>
        <Text style={styles.subtituloPantalla}>
          Ingresa la identificación registrada por el profesor.
        </Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>Importante</Text>
          <Text style={styles.textoTarjeta}>
            La identificación debe coincidir exactamente con la registrada por el profesor.
          </Text>
        </View>

        <Campo
          placeholder="Identificación del estudiante"
          value={identificacionVincular}
          onChangeText={setIdentificacionVincular}
          keyboardType="numeric"
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal titulo="Vincular" onPress={vincularEstudiante} />
        )}

        <BotonSecundario titulo="Volver" onPress={() => setPantalla('panelPadre')} />
      </Pantalla>
    );
  }

  if (pantalla === 'detalleEstudiantePadre') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Información del estudiante</Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>
            {estudiantePadreSeleccionado?.nombres} {estudiantePadreSeleccionado?.apellidos}
          </Text>
          <Text style={styles.textoDetalle}>
            Identificación: {estudiantePadreSeleccionado?.identificacion}
          </Text>
          <Text style={styles.textoDetalle}>
            Dirección: {estudiantePadreSeleccionado?.direccion || 'Sin dirección'}
          </Text>
          <Text style={styles.textoDetalle}>
            Fecha de nacimiento: {estudiantePadreSeleccionado?.fecha_nacimiento || 'Sin fecha'}
          </Text>
          <Text style={styles.textoDetalle}>
            Grado: {estudiantePadreSeleccionado?.grado_nombre || 'Sin grado'}
          </Text>
          <Text style={styles.textoDetalle}>
            Profesor: {estudiantePadreSeleccionado?.profesor_nombre || 'Sin profesor'}
          </Text>

          <BotonPrincipal
            titulo="Chat con el profesor"
            onPress={() => abrirChatPadre(estudiantePadreSeleccionado)}
          />
          <BotonSecundario titulo="Reporte académico" onPress={() => setPantalla('reporteAcademico')} />
          <BotonSecundario titulo="Calendario académico" onPress={() => setPantalla('calendarioAcademico')} />
          <BotonSecundario
            titulo="Actualizar información"
            onPress={() =>
              cargarRegistrosAcademicos(estudiantePadreSeleccionado?.id, estudiantePadreSeleccionado)
            }
          />
        </View>

        <ResumenAcademico
          notasAcademicas={notasAcademicas}
          asistenciasAcademicas={asistenciasAcademicas}
          actividadesAcademicas={actividadesAcademicas}
        />

        <Text style={styles.seccionTitulo}>Notas</Text>

        {notasAcademicas.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>Todavía no hay notas registradas.</Text>
          </View>
        ) : (
          notasAcademicas.map((nota) => (
            <View key={nota.id} style={styles.itemListaVertical}>
              <Text style={styles.itemTitulo}>{nota.titulo}</Text>
              <Text style={styles.itemSubtitulo}>Materia: {nota.materia_nombre}</Text>
              <Text style={styles.notaGrande}>Nota: {nota.nota}</Text>
              <Text style={styles.itemSubtitulo}>
                Desempeño: {nota.desempeno || obtenerDesempenoPromedio(Number(nota.nota))}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.seccionTitulo}>Asistencia</Text>

        {asistenciasAcademicas.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>Todavía no hay asistencias registradas.</Text>
          </View>
        ) : (
          asistenciasAcademicas.map((asistencia) => (
            <View key={asistencia.id} style={styles.itemListaVertical}>
              <Text style={styles.itemTitulo}>{asistencia.materia_nombre}</Text>
              <Text style={styles.itemSubtitulo}>Fecha: {asistencia.fecha}</Text>
              <Text style={styles.estadoTexto}>Estado: {asistencia.estado}</Text>
              <Text style={styles.itemSubtitulo}>
                Observación: {asistencia.observacion || 'Sin observación'}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.seccionTitulo}>Actividades</Text>

        {actividadesAcademicas.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>Todavía no hay actividades registradas.</Text>
          </View>
        ) : (
          actividadesAcademicas.map((actividad) => (
            <View key={actividad.id} style={styles.itemListaVertical}>
              <Text style={styles.itemTitulo}>{actividad.titulo}</Text>
              <Text style={styles.itemSubtitulo}>Tipo: {actividad.tipo}</Text>
              <Text style={styles.itemSubtitulo}>Materia: {actividad.materia_nombre}</Text>
              <Text style={styles.itemSubtitulo}>
                Fecha de entrega: {actividad.fecha_entrega || 'Sin fecha'}
              </Text>
              <Text style={styles.estadoTexto}>Estado: {actividad.estado}</Text>
              <Text style={styles.itemSubtitulo}>
                Descripción: {actividad.descripcion || 'Sin descripción'}
              </Text>
            </View>
          ))
        )}

        <BotonSecundario titulo="Volver al panel" onPress={() => setPantalla('panelPadre')} />
      </Pantalla>
    );
  }

  if (pantalla === 'reporteAcademico') {
    const estudianteActual = estudianteProfesorSeleccionado || estudiantePadreSeleccionado;
    const resumen = calcularResumenAcademico(
      notasAcademicas,
      asistenciasAcademicas,
      actividadesAcademicas
    );

    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Reporte académico</Text>
        <Text style={styles.subtituloPantalla}>
          Resumen general del desempeño del estudiante.
        </Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>{nombreCompleto(estudianteActual)}</Text>
          <Text style={styles.textoDetalle}>Identificación: {estudianteActual?.identificacion}</Text>
          <Text style={styles.textoDetalle}>Promedio general: {resumen.promedioTexto}</Text>
          <Text style={styles.textoDetalle}>Desempeño: {resumen.desempenoGeneral}</Text>
          <Text style={styles.textoDetalle}>Notas registradas: {resumen.cantidadNotas}</Text>
          <Text style={styles.textoDetalle}>Asistencias registradas: {resumen.totalAsistencias}</Text>
          <Text style={styles.textoDetalle}>Presentes: {resumen.totalPresentes}</Text>
          <Text style={styles.textoDetalle}>Ausencias: {resumen.totalAusencias}</Text>
          <Text style={styles.textoDetalle}>Porcentaje asistencia: {resumen.porcentajeAsistencia}%</Text>
          <Text style={styles.textoDetalle}>Actividades registradas: {resumen.totalActividades}</Text>
          <Text style={styles.textoDetalle}>Actividades pendientes: {resumen.actividadesPendientes}</Text>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>Análisis</Text>
          <Text style={styles.textoTarjeta}>{resumen.mensaje}</Text>
        </View>

        <BotonSecundario
          titulo="Volver"
          onPress={() => {
            if (perfil?.rol === 'profesor') {
              setPantalla('detalleEstudianteProfesor');
            } else {
              setPantalla('detalleEstudiantePadre');
            }
          }}
        />
      </Pantalla>
    );
  }

  if (pantalla === 'calendarioAcademico') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Calendario académico</Text>
        <Text style={styles.subtituloPantalla}>
          Actividades, tareas, exámenes y fechas importantes del estudiante.
        </Text>

        {actividadesCalendario.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>No hay actividades registradas en el calendario.</Text>
          </View>
        ) : (
          actividadesCalendario.map((actividad) => (
            <View key={actividad.id} style={styles.itemListaVertical}>
              <Text style={styles.itemTitulo}>{actividad.titulo}</Text>
              <Text style={styles.itemSubtitulo}>Tipo: {actividad.tipo}</Text>
              <Text style={styles.itemSubtitulo}>Materia: {actividad.materia_nombre}</Text>
              <Text style={styles.estadoTexto}>
                Fecha: {actividad.fecha_entrega || 'Sin fecha de entrega'}
              </Text>
              <Text style={styles.itemSubtitulo}>Estado: {actividad.estado}</Text>
              <Text style={styles.itemSubtitulo}>
                Descripción: {actividad.descripcion || 'Sin descripción'}
              </Text>
            </View>
          ))
        )}

        <BotonSecundario
          titulo="Volver"
          onPress={() => {
            if (perfil?.rol === 'profesor') {
              setPantalla('detalleEstudianteProfesor');
            } else {
              setPantalla('detalleEstudiantePadre');
            }
          }}
        />
      </Pantalla>
    );
  }

  if (pantalla === 'notificaciones') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Notificaciones</Text>
        <Text style={styles.subtituloPantalla}>
          Alertas generadas por notas, asistencia, actividades y chat.
        </Text>

        <BotonSecundario
          titulo="Actualizar notificaciones"
          onPress={() => cargarNotificaciones(usuario?.id)}
        />

        {cargandoDatos ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : notificaciones.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>Todavía no tienes notificaciones.</Text>
          </View>
        ) : (
          notificaciones.map((notificacion) => (
            <View
              key={notificacion.id}
              style={[styles.itemListaVertical, !notificacion.leida && styles.notificacionNoLeida]}
            >
              <Text style={styles.itemTitulo}>{notificacion.titulo}</Text>
              <Text style={styles.itemSubtitulo}>Tipo: {notificacion.tipo}</Text>
              <Text style={styles.textoDetalle}>{notificacion.mensaje}</Text>
              <Text style={styles.itemSubtitulo}>
                Fecha: {notificacion.created_at
                  ? notificacion.created_at.substring(0, 10)
                  : 'Sin fecha'}
              </Text>
              <Text style={styles.estadoTexto}>
                Estado: {notificacion.leida ? 'Leída' : 'No leída'}
              </Text>

              {!notificacion.leida && (
                <BotonSecundario
                  titulo="Marcar como leída"
                  onPress={() => marcarNotificacionLeida(notificacion.id)}
                />
              )}
            </View>
          ))
        )}

        <BotonSecundario
          titulo="Volver"
          onPress={() => {
            if (perfil?.rol === 'profesor') {
              setPantalla('panelProfesor');
            } else {
              setPantalla('panelPadre');
            }
          }}
        />
      </Pantalla>
    );
  }

  if (pantalla === 'horarios') {
    const dias = [
      { id: '1', nombre: 'Lunes' },
      { id: '2', nombre: 'Martes' },
      { id: '3', nombre: 'Miércoles' },
      { id: '4', nombre: 'Jueves' },
      { id: '5', nombre: 'Viernes' },
      { id: '6', nombre: 'Sábado' },
      { id: '7', nombre: 'Domingo' },
    ];

    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Horario de atención</Text>
        <Text style={styles.subtituloPantalla}>
          Define cuándo puedes atender mensajes de padres de familia.
        </Text>

        <Text style={styles.seccionTitulo}>Día</Text>

        {dias.map((dia) => (
          <TouchableOpacity
            key={dia.id}
            style={[styles.botonOpcion, diaSemana === dia.id && styles.botonOpcionActivo]}
            onPress={() => setDiaSemana(dia.id)}
          >
            <Text style={[styles.textoOpcion, diaSemana === dia.id && styles.textoOpcionActivo]}>
              {dia.nombre}
            </Text>
          </TouchableOpacity>
        ))}

        <Campo
          placeholder="Hora inicio: 14:00"
          value={horaInicio}
          onChangeText={setHoraInicio}
          keyboardType="numbers-and-punctuation"
        />
        <Campo
          placeholder="Hora fin: 16:00"
          value={horaFin}
          onChangeText={setHoraFin}
          keyboardType="numbers-and-punctuation"
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal titulo="Guardar horario" onPress={guardarHorarioAtencion} />
        )}

        <BotonSecundario
          titulo="Actualizar horarios"
          onPress={() => cargarHorariosProfesor(usuario?.id)}
        />

        <Text style={styles.seccionTitulo}>Horarios registrados</Text>

        {horariosAtencion.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>Todavía no tienes horarios registrados.</Text>
          </View>
        ) : (
          horariosAtencion.map((horario) => (
            <View key={horario.id} style={styles.itemListaVertical}>
              <Text style={styles.itemTitulo}>Día {horario.dia_semana}</Text>
              <Text style={styles.itemSubtitulo}>Desde: {horario.hora_inicio}</Text>
              <Text style={styles.itemSubtitulo}>Hasta: {horario.hora_fin}</Text>
            </View>
          ))
        )}

        <BotonSecundario titulo="Volver" onPress={() => setPantalla('panelProfesor')} />
      </Pantalla>
    );
  }

  if (pantalla === 'conversacionesProfesor') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Chats institucionales</Text>
        <Text style={styles.subtituloPantalla}>Conversaciones con padres de familia.</Text>

        <BotonSecundario titulo="Actualizar chats" onPress={cargarConversacionesProfesor} />

        {cargandoDatos ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : conversacionesChat.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>Todavía no tienes conversaciones.</Text>
          </View>
        ) : (
          conversacionesChat.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              style={styles.itemLista}
              onPress={() => seleccionarConversacionProfesor(conv)}
            >
              <View style={styles.itemContenido}>
                <Text style={styles.itemTitulo}>{conv.estudiante_nombre}</Text>
                <Text style={styles.itemSubtitulo}>Padre: {conv.padre_nombre}</Text>
              </View>
              <Text style={styles.itemFlecha}>›</Text>
            </TouchableOpacity>
          ))
        )}

        <BotonSecundario titulo="Volver" onPress={() => setPantalla('panelProfesor')} />
      </Pantalla>
    );
  }

  if (pantalla === 'chat') {
    return (
      <Pantalla>
        <Text style={styles.tituloPantalla}>Chat institucional</Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloTarjeta}>
            {conversacionSeleccionada?.estudiante_nombre || 'Conversación'}
          </Text>
          <Text style={styles.textoDetalle}>
            Padre: {conversacionSeleccionada?.padre_nombre || 'Sin padre'}
          </Text>
          <Text style={styles.textoDetalle}>
            Profesor: {conversacionSeleccionada?.profesor_nombre || 'Profesor'}
          </Text>
        </View>

        <Text style={styles.seccionTitulo}>Horario de atención</Text>

        {horariosAtencion.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>
              El profesor todavía no tiene horario de atención registrado.
            </Text>
          </View>
        ) : (
          horariosAtencion.map((horario) => (
            <View key={horario.id} style={styles.itemListaVertical}>
              <Text style={styles.itemTitulo}>Día {horario.dia_semana}</Text>
              <Text style={styles.itemSubtitulo}>
                Horario: {horario.hora_inicio} - {horario.hora_fin}
              </Text>
            </View>
          ))
        )}

        <BotonSecundario
          titulo="Actualizar mensajes"
          onPress={() => cargarMensajesChat(conversacionSeleccionada?.id)}
        />

        <Text style={styles.seccionTitulo}>Mensajes</Text>

        {cargandoDatos ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : mensajesChat.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>Todavía no hay mensajes.</Text>
          </View>
        ) : (
          mensajesChat.map((msg) => (
            <View
              key={msg.id}
              style={[styles.mensajeBurbuja, msg.es_mio ? styles.mensajeMio : styles.mensajeOtro]}
            >
              <Text style={styles.mensajeAutor}>{msg.es_mio ? 'Yo' : 'Otra persona'}</Text>
              <Text style={styles.mensajeTexto}>{msg.mensaje}</Text>
              <Text style={styles.mensajeFecha}>
                {msg.created_at ? msg.created_at.substring(0, 16).replace('T', ' ') : ''}
              </Text>
            </View>
          ))
        )}

        <Campo
          placeholder="Escribe tu mensaje"
          value={mensajeTexto}
          onChangeText={setMensajeTexto}
          multiline
        />

        {cargando ? (
          <ActivityIndicator size="large" color="#7BE845" />
        ) : (
          <BotonPrincipal titulo="Enviar mensaje" onPress={enviarMensajeChat} />
        )}

        <BotonSecundario
          titulo="Volver"
          onPress={() => {
            setMensajeTexto('');
            if (perfil?.rol === 'profesor') {
              setPantalla('conversacionesProfesor');
            } else {
              setPantalla('detalleEstudiantePadre');
            }
          }}
        />
      </Pantalla>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contenedor: {
    flex: 1,
    backgroundColor: '#01061C',
  },
  scroll: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoTexto: {
    fontSize: 46,
    fontWeight: 'bold',
    color: '#7BE845',
    textAlign: 'center',
    marginBottom: 14,
  },
  descripcion: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 30,
    lineHeight: 24,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    width: '100%',
    marginBottom: 20,
  },
  tituloTarjeta: {
    color: '#002448',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textoTarjeta: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  textoDetalle: {
    color: '#333333',
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 8,
  },
  tituloPantalla: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7BE845',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtituloPantalla: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 14,
    fontSize: 16,
    color: '#000000',
  },
  inputGrande: {
    height: 110,
    textAlignVertical: 'top',
  },
  botonPrincipal: {
    backgroundColor: '#22C356',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonSecundario: {
    borderColor: '#07A9E7',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  textoBotonSecundario: {
    color: '#07A9E7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonPeligro: {
    borderColor: '#D93025',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  textoBotonPeligro: {
    color: '#D93025',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectorRol: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    marginBottom: 18,
  },
  botonRol: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  botonRolActivo: {
    backgroundColor: '#22C356',
  },
  textoRol: {
    fontWeight: 'bold',
    color: '#002448',
  },
  textoRolActivo: {
    color: '#FFFFFF',
  },
  seccionTitulo: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 10,
  },
  seccionTituloInterno: {
    color: '#002448',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  tarjetaVacia: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  textoVacio: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 22,
  },
  itemLista: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemListaVertical: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  filaEntre: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificacionNoLeida: {
    borderWidth: 2,
    borderColor: '#22C356',
  },
  itemContenido: {
    flex: 1,
  },
  itemTitulo: {
    color: '#002448',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSubtitulo: {
    color: '#555555',
    fontSize: 14,
    marginTop: 2,
  },
  itemFlecha: {
    color: '#22C356',
    fontSize: 36,
    fontWeight: 'bold',
  },
  notaGrande: {
    color: '#22C356',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
  },
  estadoTexto: {
    color: '#07A9E7',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 6,
  },
  contenedorNumeros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  botonNumero: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  botonNumeroActivo: {
    backgroundColor: '#22C356',
  },
  textoNumero: {
    color: '#002448',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textoNumeroActivo: {
    color: '#FFFFFF',
  },
  botonOpcion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },
  botonOpcionActivo: {
    backgroundColor: '#22C356',
  },
  textoOpcion: {
    color: '#002448',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  textoOpcionActivo: {
    color: '#FFFFFF',
  },
  filaOpciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  botonPeriodo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    width: '22%',
    alignItems: 'center',
  },
  mensajeBurbuja: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  mensajeMio: {
    backgroundColor: '#D9FFD0',
    marginLeft: 40,
  },
  mensajeOtro: {
    backgroundColor: '#FFFFFF',
    marginRight: 40,
  },
  mensajeAutor: {
    color: '#002448',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mensajeTexto: {
    color: '#222222',
    fontSize: 15,
    lineHeight: 21,
  },
  mensajeFecha: {
    color: '#666666',
    fontSize: 12,
    marginTop: 6,
  },
});