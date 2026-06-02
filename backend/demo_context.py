"""Demo context: ContextVar untuk mengisolasi DB per demo session."""
from contextvars import ContextVar, Token
from typing import Optional

# Satu ContextVar per demo app (bisa dikembangkan ke apps lain)
_kn3_db_var: ContextVar = ContextVar("kn3_demo_db", default=None)


def set_kn3_demo_db(db) -> Token:
    """Set demo DB untuk request saat ini. Return token untuk reset."""
    return _kn3_db_var.set(db)


def get_kn3_demo_db():
    """Get demo DB dari context. None jika tidak di-set."""
    return _kn3_db_var.get()


def reset_kn3_demo_db(token: Token) -> None:
    _kn3_db_var.reset(token)
