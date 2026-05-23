
import scripts.modules.loaders.universal_files_loader
u_loader = scripts.modules.loaders.universal_files_loader
import kivy.core.audio
SoundLoader = kivy.core.audio.SoundLoader
import settings
globals().update({k: v for k, v in settings.__dict__.items() if not k.startswith('__')})
import os

_audio_paths_iterator = (path for path in AUDIO_PATHS)
_files_iterator = None
_audio_container = {}

def next_audio_paths_iterator():
	global _path, file_names
	global _files_iterator
	
	p = ''
	try:
		while p=='':
			p = next(_audio_paths_iterator)
	except Exception as stp:
		raise stp
	else:
		_path, file_names = u_loader.get_filenames(p, 'Invalid Path!')
		_files_iterator = (f for f in file_names)

def next_files_iterator():
	fname = ''
	try:
		fname = next(_files_iterator)
	except Exception:
		next_audio_paths_iterator()	
	else:
		_audio_container.update({fname: SoundLoader.load(os.path.join(_path, fname))})	
		
	return os.path.join(_path, fname)

def update(dt=0, game_ref=None):
	return next_files_iterator(), False
